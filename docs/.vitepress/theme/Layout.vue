<script setup>
import DefaultTheme from 'vitepress/theme'
import NotFound from '../components/page/NotFound.vue'
const { Layout } = DefaultTheme
</script>

<template>
  <Layout>
    <template #not-found>
      <NotFound />
    </template>
  </Layout>
</template> 