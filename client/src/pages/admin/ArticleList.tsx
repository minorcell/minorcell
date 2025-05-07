import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';

interface Article {
  id: number;
  title: string;
  status: 'published' | 'draft';
  createdAt: string;
  updatedAt: string;
}

const AdminArticleList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 这里应该是从API获取文章列表的逻辑
    // 暂时使用模拟数据
    const fetchArticles = async () => {
      try {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockArticles: Article[] = [
          {
            id: 1,
            title: '如何使用React Router实现路由守卫',
            status: 'published',
            createdAt: '2025-05-01',
            updatedAt: '2025-05-01'
          },
          {
            id: 2,
            title: 'TypeScript高级类型技巧',
            status: 'published',
            createdAt: '2025-04-28',
            updatedAt: '2025-04-29'
          },
          {
            id: 3,
            title: '未完成的草稿文章',
            status: 'draft',
            createdAt: '2025-05-05',
            updatedAt: '2025-05-05'
          }
        ];
        
        setArticles(mockArticles);
      } catch (error) {
        console.error('获取文章列表失败', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这篇文章吗？此操作不可撤销。')) {
      return;
    }
    
    try {
      // 这里应该是调用删除文章的API
      // 暂时使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 更新本地状态
      setArticles(articles.filter(article => article.id !== id));
      alert('文章已成功删除');
    } catch (error) {
      console.error('删除文章失败', error);
      alert('删除文章失败，请稍后再试');
    }
  };

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <Link 
          to="/manage/article/editor" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          创建新文章
        </Link>
      </div>
      
      {articles.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  更新时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {articles.map(article => (
                <tr key={article.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{article.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      article.status === 'published' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {article.status === 'published' ? '已发布' : '草稿'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {article.updatedAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      to={`/manage/article/editor/${article.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      编辑
                    </Link>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500 mb-4">暂无文章</p>
          <Link 
            to="/manage/article/editor" 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            创建第一篇文章
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminArticleList;
