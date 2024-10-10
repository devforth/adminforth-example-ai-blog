<template>
  <div class="post-card">
    <img v-if="props.post.picture" :src="props.post.picture" alt="post image" />
    <h2>{{ props.post.title }}</h2>
    <div class="content" v-html="props.post.content"></div>
    <div class="posted-at">
      <div>{{ formatDate(props.post.createdAt) }}</div>
      <div class="author">
        <img :src="props.post.author.avatar" alt="author avatar" />
        <div>
          {{ props.post.author.publicName }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

const props = defineProps<{
  post: {
    title: string
    content: string
    createdAt: string // iso date
    picture?: string
    author: {
      publicName: string
      avatar: string
    }
  }
}>()


function formatDate(date: string) {
  // format to format MMM DD, YYYY using Intl.DateTimeFormat
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric'
  }).format(new Date(date))
}
</script>

<style lang="scss">

.post-card {
  background-color: rgba(255 244 255 / 0.43);
  padding: 2rem;
  border-radius: 0.5rem;
  border: 1px solid #FFFFFF;
  box-shadow: 0.2rem 0.3rem 2rem rgba(0, 0, 0, 0.1);
  max-width: calc(100vw - 4rem);
  width: 600px;
  color: #333;
  line-height: 1.8rem;

  >img {
    width: 100%;
    border-radius: 0.5rem;
    margin-bottom: 2rem;
  }
  
  h2 {
    margin: 0 0 2rem 0;
    font-size: 1.5rem;
  }

  .content {
    margin-top: 1rem;
  }

  .posted-at {
    margin-top: 1rem;
    font-size: 0.8rem;
    color: #666;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .author {
    display: flex;
    align-items: center;

    img {
      width: 2rem;
      height: 2rem;
      border-radius: 50%;
      margin-right: 0.5rem;
    }
    div {
      // flash wire dot line effect
      position: relative;
      overflow: hidden;
      border-radius: 1rem;
      padding: 0.2rem 0.5rem;
      font-size: 1rem;
      background: linear-gradient(90deg, rgb(0 21 255) 0%, rgb(0 0 0) 100%);
      background-size: 200% auto;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent; /* Hide the original text color */
      animation: shimmer 2s infinite;
      @keyframes shimmer {
        0% {
          background-position: -200% center;
        }
        100% {
          background-position: 200% center;
        }
      }

    }
  }

}

</style>