<template>
  <div class="container">
    <PostCard 
      v-for="post in posts" 
      :key="post.id" 
      :post="post"
    />
    <div class="no-posts" v-if="!posts.length">
      No posts added yet
      <a href="/admin">Add a first one in admin</a>
    </div>
  </div>
</template>

<style lang="scss">
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  flex-direction: column;
  gap: 1rem;
  padding-top: 2rem;
}

.no-posts {
  margin-top: 2rem;
  font-size: 1.5rem;
  text-align: center;
  background-color: rgba(255 244 255 / 0.43);
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #FFFFFF;
  box-shadow: 0.2rem 0.3rem 2rem rgba(0, 0, 0, 0.1);
  color: #555;
  a {
    color: #333;
    text-decoration: underline;
    margin-top: 1rem;
    display: block;
    font-size: 1.2rem;
  }

}
</style>

<script lang="ts" setup>

import PostCard from '~/PostCard.vue'

const posts = ref([])

onMounted(async () => {
  const resp = await fetch(`/api/posts`);
  posts.value = await resp.json();
})

</script>