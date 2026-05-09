---
title: "第 24 章：Transformer：大模型的发动机"
volume: 3
chapter: 8
description: '拆解Transformer的每一个核心组件：Self-Attention、Multi-Head Attention、位置编码、前馈网络、残差连接和LayerNorm。解释为何Transformer比RNN训练快一到两个数量级。'
---


> 本章问题：为什么 Transformer 改变了语言模型？

---

Attention 解决了信息瓶颈，但它还是挂在 RNN 上的附件。RNN 的串行本质——必须等上一个词算完才能算下一个——限制了训练速度。这一章把 RNN 彻底拿掉：只用 Attention。

## 24.1 2017：抛弃 RNN

2017 年，Vaswani 等人在论文《Attention Is All You Need》中提出了 Transformer 架构。论文的标题本身就是一个宣示：

> 你只需要 Attention。

没有 RNN。没有 LSTM。没有卷积。只有 Attention 和一些前馈层堆叠在一起。

这篇文章最初是为了机器翻译任务写的——WMT 2014 英德翻译上达到了当时的最佳 BLEU 分数。但很快人们发现：这个架构不仅翻译做得好——如果你用足够的文本去训练，它能生成连贯的长文本、理解复杂的上下文、甚至做出类似推理的判断。

Transformer 就是本书所谓"大模型的发动机"——从 2017 年起，几乎所有你能叫出名字的大型语言模型（GPT、BERT、Claude、Llama、Gemini 等）在核心架构上都是 Transformer 或它的变种。

本章不堆术语，拆开每一个核心组件，让 Transformer 变得透明。

---

## 24.2 Self-Attention：一句话内部的 Attention

第 23 章的 Attention 是 Encoder-Decoder Attention——解码器去看编码器。

Transformer 在做一件更彻底的事：**让一个序列内部的每个词，去关注这个序列中的所有词——包括自己。** 这就叫 **Self-Attention（自注意力）**。

看一个例子：

> "昨天我在图书馆里读了一本关于古罗马的书。"

"古罗马"的 attention 应该在哪些词上？"关于"（直接修饰）→ 第二："书"（直接修饰的主名词）。再往外——"读"（动作）。更远处——"图书馆"（地点）得到的 attention 应该很小——地名和古罗马没有直接语义关系。

Self-Attention 的计算流程和上一章的 QKV 完全一样——区别在于：这里的 Q、K、V 全都来自同一个序列。

对于输入中的每一个位置：
1. 把该位置的向量投影为 Q、K、V。
2. 用这个位置的 Q 去查询所有位置的 K（一整句的分数）。
3. Softmax 得到注意分布。
4. 用这个分布对所有的 V 做加权平均。

做完 Self-Attention 后，每一个位置的输出都不再只是原来位置的词向量——它的表示被**全序列中所有相关位置的信息所"修饰"**。"古罗马"不再是孤立的词偶发点，它现在载着关于"书""关于""读"的信息。

---

## 24.3 Multi-Head Attention：多组并列的注意力

单头 Attention 有一个局限：每个 Q 只能在所有 K 中找一种类型的"相关性"。

但在语言中，"相关"可以是多种维度同时存在的。同一个词可以同时关注句法上的"主语"和语义上的"同义概念"。"店员"在"店员给了顾客一杯咖啡"中可以既关注"给"（句法关系），又关注"咖啡"（购买语义）。

Multi-Head Attention 就是并排做多组互相独立的 Attention——每组被称为一个"头"。每一组有自己的 W_Q、W_K、W_V 矩阵（彼此独立，初始随机，然后各自训练）。不同的头会学到不同的"关注模式"——一个头关注句法依存（主语-谓语），另一个头关注指代（"他"→前面出现的那个人的名字），第三个头关注局部词序。

做完多组 Attention 后，所有头的输出被拼在一起，再经过一个全连接投影回原始维度，成为一个"多视角修饰后"的表示。

Transformer 基础模型通常用 8 或 12 个头。所以每个位置在每一步 Self-Attention 中产生的是 8/12 个不同侧面的语境信息——这些信息一起被融合生产出该位置的新表示。

---

## 24.4 位置编码：告诉网络"你在哪里"

Self-Attention 没有内置的顺序概念。它看序列就像一个集合——同时看所有位置，没有先后。

但语言的语序有巨大信息量。"狗咬人"和"人咬狗"意思完全相反，但 Self-Attention 在原始形式下对两者产生相同的注意力分布。

Transformer 的解决方案是**位置编码（Positional Encoding）**——在每个输入向量上加上一组额外的数字，为每个位置赋予一个独特的模式。这个模式告诉网络——"第一个词在这里，第二个词在这里，第三个词在这里"。

原始 Transformer 使用**正弦位置编码**——对每个位置的每个维度的值，使用不同频率的正弦和余弦波函数。频率的设计让不同位置的编码具有一致的可线性内积规律——相隔固定距离的两个位置的编码向量会具有固定可辨别的相似性。网络可以通过学习来利用这个规律。

后来，可学习的位置嵌入（learned positional embeddings——直接让小网络自己从任务中学习位置）变得更加普遍。GPT 和 BERT 用的都是可学习位置嵌入——模型自己从数据中学习位置的影响，不用指定的正弦函数。

无论具体实现方式如何，功能是一样的——Self-Attention 层被赋予"序列顺序"的知识，同一个词在句子的不同位置会产出不同的交互作用。

---

## 24.5 前馈网络：做完注意力之后的"整理"

每个 Transformer 块里，做完 Self-Attention 之后，输出会经过一层**前馈网络（FFN）**。

FFN 的结构是：全连接 + 激活函数（通常是 ReLU 或 GELU）+ 再全连接。两层的全连接叠在一起——相当于做一个非线性变换，把 Attention 产出的信息进一步重组和抽象。

Attention 做的是"拉信息"——从全序列中搜集相关性。FFN 做的是"加工信息"——把你搜集到的所有信息重新组织/提炼。

在 Transformer 块中，Self-Attention 和 FFN 是交替的：

```
Self-Attention → LayerNorm → FFN → LayerNorm
```

每个 Transformer 块轮流做"广域搜集（attention）"和"局域加工（FFN）"。在 GPT-3 中，这个块被重复了 96 次。信息每通过一个块，都被重新审视它在一整句话中的关系，并进一步抽象。

---

## 24.6 残差连接与 LayerNorm：让深层网络可训练

Transformer 块有时会被堆叠得非常深——从 12 层到上百层。两层之间如果直接穿接，梯度极易消失或爆炸。

Transformer 继承了从 ResNet 时代来的**残差连接（residual connection）**——每个子层的输入被直接加到这个子层的输出上：`output = sublayer(x) + x`。

残差连接的效果是在反向传播时给梯度开辟了一条**直通通路**——梯度不需要穿越子层中的复杂非线性变换路径（在这些路径中会经过激活函数和乘法，容易衰减），而是可以直接沿 "加号" 把误差信号传回去。在训练非常深的 Transformer 时，这是梯度能够稳定流动的关键设计。

在每个残差加法之后是**层归一化（LayerNorm）**——把该层输出的数值归一化到均值为 0、方差为 1 的区间，然后经可学习的缩放和偏移参数调整。LayerNorm 防止不同层之间的数值尺度出现不健康的偏移，保证训练过程中隐藏状态保持在让激活函数有效运行的数值范围内。

---

## 24.7 最小代码：20 行 Transformer Block

以下代码用 PyTorch 实现一个最小的 Transformer 块——Self-Attention + FFN + 残差 + LayerNorm：

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class TransformerBlock(nn.Module):
    def __init__(self, d_model=256, n_heads=8, d_ff=512):
        super().__init__()
        self.attn = nn.MultiheadAttention(d_model, n_heads, batch_first=True)
        self.ln1 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.ReLU(),
            nn.Linear(d_ff, d_model),
        )
        self.ln2 = nn.LayerNorm(d_model)

    def forward(self, x):
        # Self-Attention + 残差 + LayerNorm
        attn_out, _ = self.attn(x, x, x)  # Q=K=V=x → Self-Attention
        x = self.ln1(x + attn_out)        # 加残差，归一化
        # FFN + 残差 + LayerNorm
        ffn_out = self.ffn(x)
        x = self.ln2(x + ffn_out)
        return x
```

这个块就是 Transformer 的心脏。GPT 本质上就是大量这样的块串在一起，然后接一个输出投影。把十二个 TransformerBlock 串成一串，你就有了一个小型的 GPT 架构骨架。

---

## 24.8 为什么 Transformer 的训练比 RNN 快得多

RNN 的致命引擎限制是——训练必须按照时间步顺序执行。"我 → 今天 → 去 → 超市 → 买 → 牛奶"——处理"超市"时，必须先算出"去"的隐状态，而"去"的隐状态又需要"今天"的隐状态。6 个词 → 必须顺序执行 6 步（每一步等待上一步的结果）——无法并行。

Self-Attention 看所有词是**同时的**。每个位置的 Q 和所有 K 的点积可以一次矩阵乘法全部完成——6 个词的句子里所有时间步的 Attention 权重在同一行计算中完成。深层模型（96 层 Transformer）可以在 GPU 上充分利用并行性。

这意味着对于同样长度的序列，Transformer 的训练时间可以比 RNN 少一到两个数量级。在 2017 年之后，这个效率差直接决定了 Transformer 成为单一的主流架构——在同样的计算预算下，Transformer 可以比 RNN 训练更多 epoch、吸收更多数据。

---

## 24.9 本章地图

```text
问题：为什么 Transformer 改变了语言模型？
方法：用 Self-Attention 替代 RNN 的时间步递推——所有词之间建立直接连接，通过 QKV 机制动态加权聚集信息；用 Multi-Head 并行捕捉多个维度的关系；用残差连接和 LayerNorm 保障深层训练稳定。
核心组件：Self-Attention（序列内全连接信息流）→ 残差 + LayerNorm → FFN（非线性加工）→ 残差 + LayerNorm。堆叠 N 次。
突破：完全并行化训练（不再受 RNN 顺序限制），长距离依赖不再是瓶颈，训练效率提升 1-2 个数量级。
今天：所有主流大语言模型（GPT、BERT、Claude、Llama、Gemini）的核心架构都是 Transformer 或其变体。
```

---

## 24.10 本章结语：所有词同时看见彼此

Transformer 的核心洞见是推翻了一个被默认接受的限制——序列处理必须沿时间步顺序进行。它证明了——如果你让每个词在每一层都能直接看到全序列的所有词（通过 Self-Attention），再加上足够深的位置编码和层归一化——你得到的模型在处理语言上远比 RNN 强大且更快。

这篇论文的标题选对了。对于语言模型领域来说，确实只需要 Attention 了。

但 Transformer 本身是一个架构框架——同一个框架，可以用在截然不同的任务上。如何用它来"理解"，和如何用它来"生成"——这两条路线对应着两个改变了 NLP 的模型。

下一章，BERT 与 GPT：理解和生成的分岔路。
