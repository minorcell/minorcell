---
title: "第 31 章：从零训练一个小型中文 GPT"
volume: 4
chapter: 4
description: '用纯PyTorch从零训练一个1000万参数的中文MiniGPT——涵盖字符级分词器、Decoder-only Transformer搭建、训练循环与自回归生成的完整实操。'
---


> 本章问题：一个完整的大语言模型——从分词到生成——从头到尾各需要什么？

---

## 31.1 你将要造的东西

前 30 章，你走完了从图灵到 ChatGPT 的全部道路。但你可能还有一个合理的感觉——"知道每一块砖是什么，但还没亲手砌过一堵墙。"

这一章就是你的那堵墙。

你将用纯 PyTorch（不需要 HuggingFace、不需要预训练权重、不需要 API key）从零训练一个**小型中文 GPT**。它只有约 1000 万参数——相比之下 GPT-3 有 1750 亿参数——但它包含一个完整大语言模型的所有核心组件：

```
字符级分词器 → Token Embedding + Position Embedding → 
N 层 Decoder-only Transformer → LM Head → 交叉熵损失
```

训练完成后，它可以用你提供的任何中文文本作为训练数据，学会续写中文——从随机乱码开始，逐步"学会"词、短语、句子结构的统计规律。

这一章比较长，但每一段代码都有用。读完你就是真的造过一个 GPT 了。

---

## 31.2 第一步：字符级分词器

大语言模型的第一步是把文本变成模型能理解的数字。对于一个尽可能简单的实验——不需要 BPE、SentencePiece 或 WordPiece。就按字符切：

```python
class CharTokenizer:
    """最简中文字符级分词器。"""
    def __init__(self, text):
        chars = sorted(list(set(text)))
        self.stoi = {ch: i for i, ch in enumerate(chars)}  # string → int
        self.itos = {i: ch for i, ch in enumerate(chars)}  # int → string
        self.vocab_size = len(chars)

    def encode(self, s):
        return [self.stoi[ch] for ch in s if ch in self.stoi]

    def decode(self, ids):
        return ''.join([self.itos.get(i, '?') for i in ids])
```

这个分词器做两件事：
- `encode("人工智能")` → 一个整数列表，每个整数对应一个字符的 ID。
- `decode([42, 108, 7, 256])` → 原来的文本。

对于一个典型的中文文本，词汇量通常在 3000-6000 个字符之间（覆盖常见汉字、标点和数字）。不需要合并、不需要子词——这在小型实验上完全够用。

---

## 31.3 第二步：加载训练数据

```python
def load_data(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
    # 可选：剔除过短的行、过多的空白
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    return text
```

你可以用任何中文文本——一本你喜欢的小说（四大名著都是公版）、维基百科中文语料的一段、或者你自己的文章。对于这个实验，10-50 万字符的纯文本就足以看到模型的进化。

如果你没有现成的文本文件——把本章的 markdown 源文件直接拿去当训练数据。让一个 GPT 去学习一本"关于如何训练 GPT"的书——很 meta。

---

## 31.4 第三步：构造训练样本

语言建模的训练样本是序列的"前 N 个词→第 N+1 个词"。对于字符级模型——每个训练样本是一段固定长度的字符序列。输入是前 block_size 个字符，标签是后移一位的同一个序列（"下一个字符"）：

```python
import torch
import numpy as np

def get_batch(data, block_size, batch_size):
    """从数据中随机取 batch_size 个长度为 block_size 的序列。"""
    ix = torch.randint(0, len(data) - block_size, (batch_size,))
    x = torch.stack([data[i:i + block_size] for i in ix])
    y = torch.stack([data[i + 1:i + block_size + 1] for i in ix])
    return x, y
```

如果 block_size = 64，数据是"人工智能正在以前所未有的速度改变人类社会"：
- x = "人工智能正在以前所未有的速度改变人类社"
- y = "工智能正在以前所未有的速度改变人类社会"

模型在每个位置上预测下一个字符。第17章的基本公式在这里完全一样——只不过现在是几千个字符的词汇表，而不是之前的 3 类鸢尾花。

---

## 31.5 第四步：搭建 GPT 模型

以下是 MiniGPT 的核心架构——一个 Decoder-only Transformer。每个组件你都在卷三各章中见过，这里把它们拼成一个完整模型：

```python
import torch.nn as nn
import torch.nn.functional as F
import math

class MiniGPT(nn.Module):
    def __init__(self, vocab_size, d_model=256, n_heads=8,
                 n_layers=6, block_size=128, dropout=0.1):
        super().__init__()
        self.token_emb = nn.Embedding(vocab_size, d_model)
        self.pos_emb = nn.Embedding(block_size, d_model)
        self.blocks = nn.ModuleList([
            TransformerBlock(d_model, n_heads, dropout)
            for _ in range(n_layers)
        ])
        self.ln_f = nn.LayerNorm(d_model)
        self.lm_head = nn.Linear(d_model, vocab_size)
        self.block_size = block_size

        # 初始化权重
        self.apply(self._init_weights)

    def _init_weights(self, module):
        if isinstance(module, nn.Linear):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)
            if module.bias is not None:
                torch.nn.init.zeros_(module.bias)
        elif isinstance(module, nn.Embedding):
            torch.nn.init.normal_(module.weight, mean=0.0, std=0.02)

    def forward(self, idx):
        B, T = idx.shape
        tok_emb = self.token_emb(idx)                        # (B, T, d_model)
        pos = torch.arange(0, T, device=idx.device)
        pos_emb = self.pos_emb(pos)                          # (T, d_model)
        x = tok_emb + pos_emb                                # 第24章：位置编码
        for block in self.blocks:
            x = block(x)                                     # Self-Attn + FFN
        x = self.ln_f(x)                                     # 最终 LayerNorm
        logits = self.lm_head(x)                             # (B, T, vocab_size)
        return logits

    @torch.no_grad()
    def generate(self, idx, max_new_tokens, temperature=1.0):
        """自回归生成——每次预测一个字符，然后把它接在输入后面。"""
        for _ in range(max_new_tokens):
            idx_cond = idx[:, -self.block_size:]  # 裁剪到 block_size
            logits = self(idx_cond)               # (B, T, vocab_size)
            logits = logits[:, -1, :] / temperature  # 只取最后一个位置
            probs = F.softmax(logits, dim=-1)
            idx_next = torch.multinomial(probs, num_samples=1)
            idx = torch.cat((idx, idx_next), dim=1)
        return idx


class TransformerBlock(nn.Module):
    """第 24 章的核心组件，完整实现。"""
    def __init__(self, d_model, n_heads, dropout=0.1):
        super().__init__()
        self.ln1 = nn.LayerNorm(d_model)
        self.attn = nn.MultiheadAttention(
            d_model, n_heads, dropout=dropout, batch_first=True)
        self.ln2 = nn.LayerNorm(d_model)
        self.ffn = nn.Sequential(
            nn.Linear(d_model, 4 * d_model),
            nn.GELU(),
            nn.Linear(4 * d_model, d_model),
            nn.Dropout(dropout),
        )

    def forward(self, x):
        # causal mask：每个位置只能看它自己及之前的词
        causal_mask = torch.triu(
            torch.ones(x.size(1), x.size(1), device=x.device),
            diagonal=1
        ).bool()
        # Self-Attention + 残差 + LayerNorm
        attn_out, _ = self.attn(
            x, x, x, attn_mask=causal_mask, need_weights=False)
        x = self.ln1(x + attn_out)
        # FFN + 残差 + LayerNorm
        x = self.ln2(x + self.ffn(x))
        return x
```

架构参数解读：

| 参数 | 含义 | 本书选用 |
|------|------|---------|
| vocab_size | 词汇表大小（字符数） | 训练数据中自动统计 |
| d_model | 隐藏状态维度 | 256 |
| n_heads | 注意力头数 | 8 |
| n_layers | Transformer 层数 | 6 |
| block_size | 最大上下文长度 | 128 |
| dropout | 正则化比例 | 0.1 |

总参数量 ≈ vocab_size × d_model（词嵌入）+ block_size × d_model（位置嵌入）+ 6 × (4 × d_model²)（Transformer 块）+ d_model × vocab_size（输出头）。在 vocab_size 约 4000、d_model=256 时，总计约 1000 万参数——完全可以在普通笔记本电脑的 CPU 上训练。

> **关于"从零"的范围**：为了代码简洁，`TransformerBlock` 中使用了 PyTorch 内置的 `nn.MultiheadAttention`，而非从矩阵乘法级别实现 Self-Attention。`nn.MultiheadAttention` 内部封装了 W_Q、W_K、W_V 的线性投影和缩放点积 Attention——这些正是第 23-24 章逐行拆解的内容。如需完全从矩阵乘法手写 Self-Attention，可参考第 24 章的实现。此外，自回归生成循环（`torch.cat` 逐 token 拼接）在生产环境中会被 KV Cache 替代以提升效率——这属于工程优化而非教学简化，不影响本章的核心学习目标。

---

## 31.6 第五步：训练循环

```python
def train(model, data, tokenizer, epochs=10, batch_size=32,
          block_size=128, lr=3e-4, device='cpu'):
    model = model.to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr)
    steps_per_epoch = len(data) // (batch_size * block_size)

    for epoch in range(epochs):
        model.train()
        total_loss = 0
        for step in range(steps_per_epoch):
            x, y = get_batch(data, block_size, batch_size)
            x, y = x.to(device), y.to(device)

            logits = model(x)                         # (B, T, vocab_size)
            loss = F.cross_entropy(
                logits.view(-1, logits.size(-1)),
                y.view(-1)
            )

            optimizer.zero_grad()
            loss.backward()
            # 梯度裁剪——防止某一步的梯度爆炸
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()

            total_loss += loss.item()

        avg_loss = total_loss / steps_per_epoch
        perplexity = math.exp(avg_loss)
        print(f"epoch {epoch + 1:>2d}/{epochs}  "
              f"loss = {avg_loss:.4f}  ppl = {perplexity:.1f}")

        # 每个 epoch 后生成一段样本文本
        if epoch % 2 == 0 or epoch == epochs - 1:
            model.eval()
            start = torch.randint(0, len(data) - 10, (1,))
            context = data[start:start + 10].unsqueeze(0).to(device)
            gen = model.generate(context, max_new_tokens=80,
                                 temperature=0.8)
            print(f"  [生成样本] {tokenizer.decode(gen[0].tolist())}")
            print()
```

困惑度（perplexity, ppl）是 NLP 中常用的指标：它是交叉熵损失的指数。直觉上——如果 ppl = 50，意味着模型在每个字符位置平均有 50 个"差不多合理"的选择。训练过程中 ppl 从几百降到几十——模型越来越"确定"下一个字符应该是什么。

---

## 31.7 第六步：运行

把所有拼在一起：

```python
# ---- 主流程 ----
if __name__ == "__main__":
    # 1. 加载数据
    text = load_data("corpus.txt")          # 替换为你的文本路径
    print(f"语料长度: {len(text):,} 字符")

    # 2. 构建分词器并编码
    tokenizer = CharTokenizer(text)
    data = torch.tensor(tokenizer.encode(text), dtype=torch.long)
    print(f"词汇表大小: {tokenizer.vocab_size}")

    # 3. 创建模型
    model = MiniGPT(
        vocab_size=tokenizer.vocab_size,
        d_model=256,
        n_heads=8,
        n_layers=6,
        block_size=128,
    )
    n_params = sum(p.numel() for p in model.parameters())
    print(f"模型参数: {n_params / 1e6:.1f}M")

    # 4. 训练
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"训练设备: {device}")
    train(model, data, tokenizer, epochs=10, device=device)

    # 5. 保存
    torch.save(model.state_dict(), "minigpt.pt")
    print("模型已保存到 minigpt.pt")
```

找一个中文 .txt 文件，把路径填入 `corpus.txt`，运行这个脚本。

CPU 上的预期训练时间：对于 10 万字符的语料、1000 万参数的模型、10 个 epoch——在普通 MacBook 上大约 10-30 分钟。你可能想先减少 epoch 数（比如 3-5）跑一次看效果，然后再加。

---

## 31.8 观察进化

训练过程中连续抽样的生成文本是最有信息量的反馈。你会看到类似以下的进化轨迹：

| Epoch | ppl | 生成样本（示意） |
|-------|-----|---------|
| 0 | 450 | "的的我是一不的的了这人有的个" |
| 2 | 180 | "这个人们有一个大人说我是" |
| 5 | 85 | "他说：我不知你有什么事，我们这里有个" |
| 8 | 52 | "那女子说道：我在这里住了三年，你是不知道我的性" |
| 10 | 38 | "贾宝玉听了，心中暗想：这人好生奇怪，倒像在那里见过" |

模型从随机乱码→出现高频字符→出现常见词组→出现部分语法结构→出现带引号的对话→出现合理的叙事模式。每一步的"智能感"都在增加——但它从头到尾都在做完全一样的事：**预测下一个字符，最大化似然。**

这就是 Scaling Law 在微观上的体现——更多的训练迭代（你在第 27 章读到的）让 loss 持续下降，每次下降都伴随着生成质量的质变。你没有改变架构——你只是让梯度多流了几轮。

---

## 31.9 本章实验扩展

这个 MiniGPT 骨架可以作为你未来实验的基础台：

- **换语料**：训练在武侠小说上→生成武侠味；训练在政府公告上→生成公文味。模型学会的"风格"完全来自训练数据的统计模式。
- **加参数**：把 d_model 从 256 升到 512，n_layers 从 6 升到 12——参数从 1000 万升到约 8500 万。你会明显看到更好的生成质量——但训练时间也会变长。
- **换分词器**：把字符级分词器换成 BPE（用 HuggingFace tokenizers 库训练一个小 BPE tokenizer）——模型能学会更高层的"子词"语义单元。
- **加温度实验**：generation 时分别用 temperature=0.2, 0.8, 1.5——观察"创造性"和"连贯性"的 tradeoff。
- **观察注意力**：在每个 TransformerBlock 中抽出 attention 权重，画热图——你会看到模型在不同层、不同头上分别关注了位置、标点、和语义相关的字符。

---

## 31.10 本章地图

```text
问题：一个完整的大语言模型——从分词到生成——从头到尾各需要什么？
方法：字符级分词器 → Token + Position Embedding → 多层 Decoder-only Transformer（带 causal mask） → LM Head → 交叉熵训练 → 自回归生成。
代码量：约 150 行纯 PyTorch，无需任何预训练模型或外部 API。
训练：在普通笔记本电脑 CPU 上，10 万字符语料、1000 万参数、10 epoch 约需 10-30 分钟。
意义：读者在亲手训练 mini GPT 的过程中，把前 30 章的全部理论和组件组装成一个运转的系统——这是全书理论和实践的汇交点。
```

---

## 31.11 本章结语：你造的确实是一个 GPT

你现在造的这个东西——如果你把 d_model 从 256 调到 12288（GPT-3 的尺寸），n_layers 调到 96，把字符级分词器换成 5 万词 BPE tokenizer，在 3000 亿 token 上训练几个月——你就得到了 GPT-3。

架构完全一样。Tokenizer + Embedding + Transformer Blocks + LM Head + 交叉熵。差别只是规模和训练数据量的指数倍放大——这正是第 27 章 Scaling Law 告诉你的故事：更大模型、更多数据、更多算力带来可预测的能力涌现。

但你不需要 3000 亿 token 就能理解这个架构。1000 万参数 + 一本小说就够了。看 loss 从 6 降到 3、看生成从乱码变成语句、看 perplexity 从几百跌到几十——你对大模型的理解会从"理论上知道"变成"体感上确认"。

**知道每一块砖是什么，和你亲手砌过一堵墙，是两种完全不同的认知。**

下一章：微调——如何把一个已经训练好的大型模型适配到你的特定任务上。
