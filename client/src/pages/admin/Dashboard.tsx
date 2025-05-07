import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';

interface Stats {
  totalArticles: number;
  totalTags: number;
  totalViews: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    totalTags: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 这里应该是从API获取统计数据的逻辑
    // 暂时使用模拟数据
    const fetchStats = async () => {
      try {
        // 模拟API延迟
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setStats({
          totalArticles: 15,
          totalTags: 8,
          totalViews: 1250
        });
      } catch (error) {
        console.error('获取统计数据失败', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-8">加载中...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">控制面板</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">文章总数</h3>
          <p className="text-3xl font-bold">{stats.totalArticles}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">标签总数</h3>
          <p className="text-3xl font-bold">{stats.totalTags}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-500">总浏览量</h3>
          <p className="text-3xl font-bold">{stats.totalViews}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">快速操作</h3>
          </div>
          <div className="space-y-2">
            <Link 
              to="/manage/article/editor" 
              className="block w-full text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              创建新文章
            </Link>
            <Link 
              to="/manage/article/list" 
              className="block w-full text-center py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            >
              管理文章
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">最近活动</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              <span>新文章《示例文章》已发布</span>
              <span className="ml-auto text-gray-500">2小时前</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              <span>更新了文章《另一篇文章》</span>
              <span className="ml-auto text-gray-500">昨天</span>
            </div>
            <div className="flex items-center text-sm">
              <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
              <span>添加了新标签"技术"</span>
              <span className="ml-auto text-gray-500">3天前</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
