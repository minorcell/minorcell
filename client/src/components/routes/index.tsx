import { Routes, Route, Navigate, useLocation } from "react-router";
import { ReactNode, useEffect } from "react";

import Home from "../../pages/Home";
import ArticleDetail from "../../pages/ArticleDetail";
import Login from "../../pages/admin/Login";
import Dashboard from "../../pages/admin/Dashboard";
import AdminArticleList from "../../pages/admin/ArticleList";
import ArticleEditor from "../../pages/admin/ArticleEditor";

interface RouteMetaInfo {
  title: string;
  requiresAuth: boolean;
  isAdmin?: boolean;
}

interface ProtectedRouteProps {
  children: ReactNode;
  meta: RouteMetaInfo;
}

const ProtectedRoute = ({ children, meta }: ProtectedRouteProps) => {
  const location = useLocation();
  
  const isAuthenticated = localStorage.getItem("token") !== null;
  
  const isAdmin = localStorage.getItem("isAdmin") === "true";
  
  useEffect(() => {
    document.title = `${meta.title} | Mcell's Blog`;
  }, [meta.title]);
  
  if (meta.requiresAuth && !isAuthenticated) {
    return <Navigate to="/manage/login" state={{ from: location }} replace />;
  }
  
  if (meta.isAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const RouteConfig = () => {
  return (
    <Routes>
      <Route path="/" element={
        <ProtectedRoute meta={{ title: "首页", requiresAuth: false }}>
          <Home />
        </ProtectedRoute>
      } />
      
      <Route path="article">
        <Route path=":id" element={
          <ProtectedRoute meta={{ title: "博客详情", requiresAuth: false }}>
            <ArticleDetail />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="manage">
        <Route path="login" element={
          <ProtectedRoute meta={{ title: "管理员登录", requiresAuth: false }}>
            <Login />
          </ProtectedRoute>
        } />
        <Route path="dashboard" element={
          <ProtectedRoute meta={{ title: "控制面板", requiresAuth: true, isAdmin: true }}>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="article">
          <Route path="list" element={
            <ProtectedRoute meta={{ title: "文章管理", requiresAuth: true, isAdmin: true }}>
              <AdminArticleList />
            </ProtectedRoute>
          } />
          <Route path="editor" element={
            <ProtectedRoute meta={{ title: "新建文章", requiresAuth: true, isAdmin: true }}>
              <ArticleEditor />
            </ProtectedRoute>
          } />
          <Route path="editor/:id" element={
            <ProtectedRoute meta={{ title: "编辑文章", requiresAuth: true, isAdmin: true }}>
              <ArticleEditor />
            </ProtectedRoute>
          } />
        </Route>
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      
      <Route path="*" element={
        <ProtectedRoute meta={{ title: "页面未找到", requiresAuth: false }}>
          <div>404 - 页面未找到</div>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default RouteConfig;
