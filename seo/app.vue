<template>
  <div id="app">
    <NuxtPage />
  </div>
</template>


<style lang="scss">

$grColor1: #74E1FF;
$grColor2: #8580B4;
$grColor3: #5E53C3;
$grColor4: #4FC7E9;
$grColor5: #695BE9;

  #app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    // gradient with color spots
    animation: gradient 15s ease infinite;
    min-height: 100vh;
  }
  body {
    margin: 0;
    padding: 0;
    max-height: 100vh;
    overflow: overlay;
    background-image: radial-gradient(
  circle farthest-corner at top left, $grColor1 0%, rgba(225, 243, 97,0) 50%),
      radial-gradient(
      circle farthest-side at top right, $grColor2 0%, rgba(181, 176, 177,0) 10%),
      radial-gradient(circle farthest-corner at bottom right, $grColor3 0%, rgba(204, 104, 119, 0) 33%),
      radial-gradient(
          circle farthest-corner at top right, $grColor4 0%, rgba(155, 221, 240,0) 50%),
      radial-gradient(ellipse at bottom center, $grColor5 0%, rgba(254, 43, 0, 0) 80%); 
    background-attachment: fixed;
  }
</style>