---
title: "第 22 章：Seq2Seq：机器翻译的旧时代"
volume: 3
chapter: 6
description: '阐述Seq2Seq编码器-解码器架构如何实现序列到序列的转换。讲解上下文向量瓶颈、Teacher Forcing训练技巧，为下一章Attention的引入铺垫——固定向量通道的根本局限。'
---


> 本章问题：一个模型如何把一种序列变成另一种序列？

---

## 22.1 不止是分类

前几章的网络有一类默认假设：输入和输出的形状是固定的。图片 → 类别。词 → 临近词。这没问题——如果你要做的就是从有限选项中择一。

但翻译不是这样的。

输入"猫在垫子上"有 5 个词，输出"The cat is on the mat"有 6 个词。而且输入的词和输出的词之间不是一一对应的——"在……上"这一个词对应了两个英文词 "on the"。词的对应还是跨位置重排的——各语言有自己的语序习惯。

你需要的不是"输入一个向量，输出一个类别"。你需要**输入一个序列，输出另一个序列**。

这就是 Seq2Seq 解决的问题：序列到序列的转换。

---

## 22.2 编码器-解码器骨架

2014 年，Sutskever 等人的团队和 Cho 等人的团队几乎同时提出了序列到序列的架构。其逻辑是两个对称的 RNN。

**编码器**读整个输入句子，一个词一个词地吞进去，维持一个不断更新的隐藏状态。当输入句子的最后一个词被读完时，编码器最后的隐藏状态被假定包含了整个输入句子的语义精华——这个固定大小的向量，被称为**上下文向量（context vector）**。

**解码器**拿到这个上下文向量作为它的初始隐藏状态，然后一个词一个词地生成输出句子。在每一个生成步，它把上一步生成的词和当前的隐藏状态结合起来进行下一步生成。

用比喻来说：编码器 = 一个人先读完了源语言的整个句子，在脑子里形成了一个"意思"。解码器 = 这个人把脑子里的"意思"用目标语言讲出来。"意思"的容器是那个几百维的上下文向量。这个向量是编码器和解码器之间唯一的通信通道。

---

## 22.3 瓶颈：一个向量装不下一整句话

上下文向量的维度通常是 256、512 或 1024。编码器把它读过的所有东西——每个词、句法关系、语序、时态、指代——要压缩进这一个定长向量里。

短句还行——"我吃苹果"没有太多要装的信息。

长句是灾难。"我今天早上在街角那家新开的、装修很漂亮的面包店里买了两个刚出炉的牛角面包带回办公室给同事们当早餐"——当一个有 50 个词的复杂句子被全部压缩到同一个 512 维的向量时，靠后的信息很容易把靠前的信息"挤出去"。解码器在生成前半段时尚能维持住意思，但生成到后面时可能已经不知道原本的主语了。

这个瓶颈可以直观地用一个现象来理解：较早的 Seq2Seq 翻译模型在长句上的表现随输入长度增加而急剧下降。

这个瓶颈也是驱动 Attention 被发明的关键动机。

---

## 22.4 Teacher Forcing：教翻译的诀窍

训练 Seq2Seq 时有一个微妙的麻烦：在训练阶段，解码器是用什么来产生下一步输入的？

有两种方式。**自由运行（free-running）**——让解码器把上一步自己的预测作为下一步的输入。这很自然——推理的时候你确实没有标准答案。但坏处是模型前期在犯错时会把错误级联到后面所有步——一个错误的"选择"污染了整个下游训练序列。

**Teacher forcing**——在训练时，强制解码器使用上一步的**标准答案词**（而不是模型自己的预测）作为下一步的输入。也就是说，教师告诉学生在每一个中间步"正确的上一步是什么"，学生从这个正确的基础出发来尝试预测下一步。

这大大稳定了训练。当你总给学生正确的下一步的前提时，每一步的错误都不会污染下游——学生在每一步都在学习"基于正确的语境，下一步应该是什么"。而且收敛速度快得多。

但 teacher forcing 也带来了一个训练和推理之间的差异——训练时学生总是拿到"好"的上一步上下文，推理时却没有老师给标准答案。推理时的错误会累积。这个差异被称为**曝光偏差（exposure bias）**。

缓解的方式包括——中间地带的**计划采样（scheduled sampling）**——在训练过程中逐步从 teacher forcing（100%用正确上一步）过渡到自由运行（100%用自己的预测）。后期实验也有使用**强化学习**方法来直接针对推理质量指标进行训练，让模型学会从自己的错误中恢复。

---

## 22.5 最小代码：Seq2Seq 字符级翻译

以下代码用 GRU 构建一个最小 Seq2Seq，执行字符级的"数字拼写翻译"——输入 "123" 的阿拉伯数字，输出 "one two three" 的英文拼写。数据迷你，重在流程。

```python
import torch
import torch.nn as nn

# 1. 迷你训练数据（数字 → 拼写）
pairs = [
    ("123", "one two three"),
    ("12", "one two"),
    ("23", "two three"),
    ("1", "one"),
    ("3", "three"),
    ("31", "three one"),
    ("231", "two three one"),
]

# 2. 构建字符级词表
src_chars = sorted(set(c for s, _ in pairs for c in s))
tgt_chars = sorted(set(c for _, t in pairs for c in t) | {"<s>", "<e>"})
src_vocab = {c: i for i, c in enumerate(src_chars)}
tgt_vocab = {c: i for i, c in enumerate(tgt_chars)}
tgt_idx = {i: c for c, i in tgt_vocab.items()}

# 3. Encoder-Decoder
class Seq2Seq(nn.Module):
    def __init__(self):
        super().__init__()
        self.enc = nn.GRU(8, 16, batch_first=True)
        self.dec = nn.GRU(8, 16, batch_first=True)
        self.out = nn.Linear(16, len(tgt_chars))

    def forward(self, src, tgt):
        _, h = self.enc(src)                    # 编码器：源序列 → 最后隐藏状态
        out, _ = self.dec(tgt, h)               # 解码器：目标序列 + 编码器状态
        return self.out(out)                    # 投影到词表分布

model = Seq2Seq()
opt = torch.optim.Adam(model.parameters(), lr=0.01)

# 4. 训练（teacher forcing）
for epoch in range(2000):
    total_loss = 0
    for src_str, tgt_str in pairs:
        # 转为 one-hot 向量
        src = torch.zeros(1, len(src_str), len(src_chars))
        for i, c in enumerate(src_str):
            src[0, i, src_vocab[c]] = 1

        tgt_in = ["<s>"] + list(tgt_str)
        tgt_out = list(tgt_str) + ["<e>"]
        tgt = torch.zeros(1, len(tgt_in), len(tgt_chars))
        for i, c in enumerate(tgt_in):
            tgt[0, i, tgt_vocab[c]] = 1
        tgt_label = torch.tensor([[tgt_vocab[c] for c in tgt_out]])

        out = model(src, tgt)                   # 前向
        loss = nn.functional.cross_entropy(
            out.view(-1, len(tgt_chars)), tgt_label.view(-1))
        opt.zero_grad()
        loss.backward()
        opt.step()
        total_loss += loss.item()

    if epoch % 500 == 0:
        print(f"epoch {epoch:4d} loss {total_loss/len(pairs):.3f}")

# 5. 推理（自由运行）
model.eval()
with torch.no_grad():
    for src_str, _ in pairs[:3]:
        src = torch.zeros(1, len(src_str), len(src_chars))
        for i, c in enumerate(src_str):
            src[0, i, src_vocab[c]] = 1
        _, h = model.enc(src)                     # 编码
        out_seq = []
        token = torch.zeros(1, 1, len(tgt_chars))
        token[0, 0, tgt_vocab["<s>"]] = 1
        for _ in range(20):
            out, h = model.dec(token, h)          # 逐步解码
            nxt = out[0, -1].argmax().item()
            if nxt == tgt_vocab["<e>"]:
                break
            out_seq.append(tgt_idx[nxt])
            token = torch.zeros(1, 1, len(tgt_chars))
            token[0, 0, nxt] = 1
        print(f"'{src_str}' → '{' '.join(out_seq)}'")
```

---

## 22.6 本章地图

```text
问题：一个模型如何把一种序列变成另一种序列？
方法：Seq2Seq 架构——编码器 RNN 把输入序列压缩为一个上下文向量，解码器 RNN 从上下文向量中解压出输出序列。
关键技巧：Teacher forcing——训练时用正确答案为上一步输入，稳定收敛，但引入曝光偏差。
局限：固定大小的上下文向量成为信息瓶颈——编码器的所有信息必须穿过这个几百维的向量，长句表现快速衰减。
今天：Transformer 的 encoder-decoder 变体在结构上保留了 Seq2Seq 的"编码-解码"框架，但用 attention 替换了固定上下文向量的瓶颈，使解码器能在每一个生成步直接"看到"整个输入序列。
```

---

## 22.7 本章结语：瓶颈中的裂缝

Seq2Seq 是优雅的。它干净地区分了"理解"（编码）和"生成"（解码），并且端到端可训练——不需要人去标注中间对齐。它让端到端的机器翻译在 RNN 内的一个架构里成为现实——这在符号主义时代是无法想象的。

但上下文向量的瓶颈——让整句的语义信息流过只有一个固定宽度的狭窄通道——是一个根本的局限性。

信息不能被压缩进这一个瓶颈里——那只可能是把窗口直接打开。让解码器在每一个生成步，都直接看到整个输入序列。这是 Attention 的声音。

下一章，Attention：让模型学会关注。
