<script setup>
import DefaultTheme from 'vitepress/theme'
import NotFound from '../components/page/NotFound.vue'
import HomePage from '../components/page/HomePage.vue'
import { useData } from 'vitepress'

const { Layout } = DefaultTheme
const { frontmatter } = useData()
</script>

<template>
  <HomePage v-if="frontmatter.layout === 'home'" />
  <Layout v-else>
    <template #not-found>
      <NotFound />
    </template>
  </Layout>
</template> 