import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router';

interface Article {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  author: string;
}

const ArticleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 这里应该是从API获取文章详情的逻辑
    // 暂时使用模拟数据
    const mockArticle: Article = {
      id: Number(id),
      title: `文章 ${id} 的标题`,
      content: `这是文章 ${id} 的详细内容。这里可以包含很多段落，图片，代码等内容。`,
      createdAt: '2025-05-01',
      author: 'Mcell'
    };
    
    setTimeout(() => {
      setArticle(mockArticle);
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  if (!article) {
    return <div className="text-center py-8">文章不存在或已被删除</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
      <div className="text-sm text-gray-500 mb-6">
        <span>作者: {article.author}</span>
        <span className="mx-2">|</span>
        <span>发布于: {article.createdAt}</span>
      </div>
      
      <div className="prose max-w-none">
        {article.content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">{paragraph}</p>
        ))}
      </div>
    </div>
  );
};

export default ArticleDetail;
