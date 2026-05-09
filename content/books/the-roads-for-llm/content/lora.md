---
title: "第 33 章：LoRA：只训练「变化量」"
volume: 4
chapter: 6
description: '讲解LoRA（低秩适配）的核心公式与实现原理——只训练增量矩阵而非全量参数，用消费级GPU即可高效微调大语言模型的参数高效微调方法。'
---


> 本章问题：不能改整个模型——能不能只学一个"增量"，然后把这个增量加在模型上？

---

## 33.1 观察：微调更新权重的"内在维度"

2021 年，微软的 Edward Hu 等人提出了一个发现：

全参数微调一个大模型时，虽然模型的权重矩阵可能有 4096×4096 = 1600 万个参数——但微调过程中**权重实际发生的有效变化，可以用一个远小于原始矩阵秩的矩阵来描述**。

换句话说：当你在微调一个已经预训练好的模型时，你不需要更新原始的 1600 万参数——你只需要更新一个 4096×8 矩阵和一个 8×4096 矩阵（总计 65,536 个参数，比原始矩阵小了约 250 倍）。因为"从预训练权重到微调后权重"的变化本身就压缩在一个低维子空间中。

这在直觉上也有道理：预训练已经把模型搬到了一个"好区域"——微调只是在这个区域中做微小的移动，而不是在全部 1600 万维的参数空间中四处跳跃。

这个发现直接催生了 LoRA——**Low-Rank Adaptation，低秩适配**。

---

## 33.2 LoRA 的核心公式

LoRA 做了一个非常优雅的数学简化：

不做微调时，原始的前向传播是：

```
h = W · x
```

其中 W 是一个预训练好的权重矩阵（d × d），x 是输入向量。在训练中 W 被冻结——不更新。

LoRA 在 W 旁边引入一个旁路：

```
h = W · x + (B · A) · x
```

其中：
- A 是 (d × r) 矩阵，B 是 (r × d) 矩阵
- r 是"秩"——通常设为 8、16 或 32
- r << d（例如 d = 4096, r = 8）

关键点：**在微调时，W 被冻结——只有 A 和 B 被训练。** A 用随机高斯初始化，B 初始化为全零——这样就保证了在训练开始时 LoRA 旁路的输出为零（ΔW = B·A = 0），模型的行为和预训练完全一致。

训练完成后——你可以把 B·A 乘出来加到 W 上（W' = W + B·A），推理时完全不需要 LoRA 旁路——W' 就是"微调后的权重"。

---

## 33.3 参数量对比：8 对比 1600 万

拿 GPT-3 的注意力层的 QKV 投影矩阵举例：

| 矩阵 | 形状 | 原始参数量 | LoRA (r=8) |
|------|------|-----------|------------|
| W_Q | 12288 × 128 | 1,572,864 | 12288×8 + 8×128 = 99,328 |
| W_K | 12288 × 128 | 1,572,864 | 12288×8 + 8×128 = 99,328 |
| W_V | 12288 × 128 | 1,572,864 | 12288×8 + 8×128 = 99,328 |
| W_O | 128 × 12288 | 1,572,864 | 128×8 + 8×12288 = 99,328 |
| 四矩阵总计 | | ~6.3M (一层) | ~397K (一层) |

LoRA 需要的训练参数量是原始矩阵的约 1/16——在 r=8 的设置下。原始论文中在 GPT-3 175B 上用 LoRA 做微调，可训练参数减少了 10,000 倍，GPU 内存需求减少了 3 倍——但同时在下游任务上的表现非常接近全参数微调。

这意味着你可以在一张消费级 GPU（RTX 3090/4090，24GB 显存）上微调像 LLaMA-7B 这样的模型——而全参数微调 LLaMA-7B 需要 4-8 张 A100。

---

## 33.4 把 LoRA 加在哪里

LoRA 可以选择性地添加在模型的不同权重矩阵上。原始论文的实验结果表明：

- 只加在 W_Q 和 W_V 上（注意力机制的 Query 和 Value 矩阵）：效果好，参数少。
- 加在 W_Q、W_K、W_V、W_O（全部四个注意力矩阵）上：效果最好，参数更多。
- 只加在 FFN 的权重上：效果不如加在 Attention 矩阵上——表明微调过程中发生的重要"变化"更多集中在 Attention 机制中。

大多数开源 LoRA 实现默认把 LoRA 添加在 Q 和 V 矩阵上——这是参数量和效果之间的最佳帕累托点——用最小的训练代价获得接近全参数微调的效果。

---

## 33.5 最小代码：实现一个 LoRA 线性层

以下代码完整实现了 LoRA 线性层——可以在任何 nn.Linear 上替换：

```python
import torch
import torch.nn as nn

class LoRALinear(nn.Module):
    def __init__(self, linear: nn.Linear, r=8, alpha=16, dropout=0.0):
        super().__init__()
        self.linear = linear  # 原始权重，冻结
        d_in, d_out = linear.in_features, linear.out_features

        # 冻结原始权重
        self.linear.weight.requires_grad = False
        if self.linear.bias is not None:
            self.linear.bias.requires_grad = False

        # LoRA 低秩矩阵
        self.A = nn.Parameter(torch.randn(r, d_in) * 0.02)
        self.B = nn.Parameter(torch.zeros(d_out, r))
        self.scaling = alpha / r
        self.dropout = nn.Dropout(dropout) if dropout > 0 else nn.Identity()

    def forward(self, x):
        # 原始路径（冻结，不计算梯度）
        base = self.linear(x)
        # LoRA 旁路：x → A → dropout → B
        lora_out = self.dropout(x) @ self.A.T @ self.B.T
        return base + lora_out * self.scaling
```

用法：

```python
# 原始层
original = nn.Linear(768, 768)
# 替换为 LoRA 版本
lora_layer = LoRALinear(original, r=8, alpha=16)

# 训练时只有 A 和 B 被更新
optimizer = torch.optim.AdamW(lora_layer.parameters(), lr=1e-4)
# 注意：lora_layer.parameters() 只包含 A 和 B
# linear.weight 已经 requires_grad=False
```

`alpha` 是一个缩放因子——在 α/r 时，如果你想让 LoRA 的更新更"大胆"，就用更大的 alpha；想让更新更保守，就用更小的 alpha。α 默认等于 r（即 α/r=1）是通常的起点。许多实践者在初次使用时保持 α = r（如 r=8, α=8），后期如果发现效果不如全参数微调才去调大。

训练完成后合并回原始权重：

```python
# 把 LoRA 合并回原始权重（推理时用）
with torch.no_grad():
    delta = (lora_layer.B @ lora_layer.A) * lora_layer.scaling
    lora_layer.linear.weight += delta

# 现在可以直接用 original linear 做推理，删掉 LoRA 旁路
```

---

## 33.6 用 PEFT 库——两行代码完成 LoRA 微调

HuggingFace 的 PEFT（Parameter-Efficient Fine-Tuning）库把 LoRA 封装到了几行代码：

```python
from peft import LoraConfig, get_peft_model, TaskType
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2-0.5B")
tokenizer = AutoTokenizer.from_pretrained("Qwen/Qwen2-0.5B")

# 配置 LoRA
lora_config = LoraConfig(
    task_type=TaskType.CAUSAL_LM,
    r=8,
    lora_alpha=16,
    target_modules=["q_proj", "v_proj"],  # 只加在 Q 和 V 上
    lora_dropout=0.1,
)
model = get_peft_model(model, lora_config)
model.print_trainable_parameters()
# 输出: trainable params: 1,048,576 || all params: 495,032,832
#        → 只有 0.21% 的参数需要训练

# 之后正常训练即可——Trainer、自定义训练循环都行
```

PEFT 把 LoRA、Adapter、Prefix Tuning 等参数高效微调方法统一在一个接口下。对于 99% 的实际微调任务，你不需要从零实现 LoRA——但理解 33.5 节中的 20 行代码让你知道它底层在做什么。

---

## 33.7 本章小实验：对比全参数微调和 LoRA

用上一章的 MiniGPT 做这个实验：

1. 把 MiniGPT 先在语料 A（比如一本小说）上训练到 ppl 约 200（建立一个"预训练基座"）。
2. 准备语料 B（另一种文风的小说或文章），作为"微调数据"。
3. 做两次微调——一次用全参数微调（更新所有参数），一次用 LoRA（把 LoRA 加到每个 TransformerBlock 的 attention 的 Q 和 V 投影上，r=8）。
4. 对比两者的 ppl、生成质量和训练时 GPU 内存占用。

你会直观地观察到：对于 MiniGPT 这种 1000 万参数的小模型——全参数微调和 LoRA 的差距如何；而对大得多的模型（比如 LLaMA-7B）——两者的差距又如何。

---

## 33.8 本章地图

```text
问题：不能改整个模型——能不能只学一个"增量"，把这个增量加在模型上？
核心发现：微调时权重的有效变化存在于一个低秩子空间中——可以用两个小矩阵的乘积来近似。
公式：h = W·x + (B·A)·x，其中 A(d×r), B(r×d), r << d。W 冻结，只训练 A 和 B。
参数量缩减：对于 GPT-3 的注意力矩阵，LoRA(r=8) 减少可训练参数约 10,000 倍。
实用性：让消费级 GPU（RTX 3090/4090）可以微调 LLaMA-7B 级别的大模型。
关键工具：HuggingFace PEFT 库——两行配置，自动在指定层上注入 LoRA 旁路。
```

---

## 33.9 本章结语：大模型的微调不再只属于大公司

LoRA 之前——微调前沿大语言模型需要数百万美元的 GPU 集群。全参数微调 GPT-3 级别的模型需要 8+ 张 A100，绝大多数研究者和公司无法企及。

LoRA 之后——任何有消费级 GPU 的人都可以在自己的数据集上微调 LLaMA、Qwen 或 DeepSeek。从一个预训练好的开源基础模型出发，几十行 Python 代码、几块钱的电费——你就能得到一个针对你的任务显著优化的模型。

这本质上是把"预训练→微调"范式的最后一块拼图补全了：预训练只有少数机构能做（成本极高），但微调（通过 LoRA）任何人都能做——开源大模型 + LoRA 让整个 AI 生态从中心化走向了分布式。

但还有一个能力缺口：模型的知识截止于训练数据的时间点。如何让模型获取未被训练过的信息——比如最新的新闻、公司的内部文档、特定的百科条目？

下一章：RAG——让模型去查资料，而不是记住所有资料。
