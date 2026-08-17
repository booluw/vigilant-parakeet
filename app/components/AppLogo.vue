<template>
  <span class="inline-flex items-center gap-2">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      class="size-8"
    >
      <defs>
        <linearGradient
          id="s3m-icon-bg"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop
            offset="0%"
            stop-color="#0076B6"
          />
          <stop
            offset="100%"
            stop-color="#005A8A"
          />
        </linearGradient>
      </defs>
      <rect
        width="512"
        height="512"
        rx="108"
        fill="url(#s3m-icon-bg)"
      />
      <text
        x="256"
        y="310"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="220"
        font-weight="800"
        fill="white"
        text-anchor="middle"
        letter-spacing="-8"
      >S3m</text>
      <polygon
        points="390,210 390,290 450,250"
        fill="white"
        opacity="0.95"
      />
      <text
        x="256"
        y="420"
        font-family="system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="100"
        font-weight="600"
        fill="white"
        text-anchor="middle"
        opacity="0.85"
        letter-spacing="24"
      >TV</text>
    </svg>
    <span class="font-bold tracking-tight">S3mTV</span>
  </span>
</template>
