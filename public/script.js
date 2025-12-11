console.log("Welcome to Youth News Hub!");

// 🌙 Dark mode toggle
const toggleButton = document.getElementById("theme-toggle");
const body = document.body;

toggleButton.addEventListener("click", () => {
  body.classList.toggle("dark-mode");
  toggleButton.textContent = body.classList.contains("dark-mode")
    ? "☀️ Light Mode"
    : "🌙 Dark Mode";
});

//  Main logic runs after DOM loads
document.addEventListener("DOMContentLoaded", () => {

  // DOM ELEMENTS
  const container = document.getElementById("news-container");
  const searchInput = document.getElementById("searchInput");
  const lastUpdated = document.getElementById("last-updated");
  const loader = document.getElementById("loader");

  // Modal elements
  const modal = document.getElementById("article-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-description");
  const modalImg = document.getElementById("modal-image");
  const modalLink = document.getElementById("modal-link");
  const closeModal = document.querySelector(".close-modal");

  // API Keys
  const GNEWS_KEY = "6091fdfb0afb1f1f52fc9dd7307d0267";
  const MEDIAPACK_KEY = "34a11449acd9be6eac157115bc083e7c";
  const CACHE_EXPIRY = 10 * 60 * 1000;

  let currentCategory = "top";

  // CATEGORY FILTER - Navbar Clicks
  document.querySelectorAll("nav a[data-category]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();

      document.querySelectorAll("nav a[data-category]").forEach(a =>
        a.classList.remove("active")
      );
      link.classList.add("active");

      currentCategory = link.getAttribute("data-category");
      fetchNews(currentCategory === "top" ? "" : currentCategory);
    });
  });

  //  Helper: Time Ago Formatter
  function timeAgo(dateString) {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (let unit in intervals) {
      const interval = Math.floor(seconds / intervals[unit]);
      if (interval >= 1) {
        return `${interval} ${unit}${interval > 1 ? "s" : ""} ago`;
      }
    }
    return "Just now";
  }

  //  Skeleton Loader (Step 8C)
  function showSkeleton(count = 6) {
    hideSkeleton();
    const skeletonGrid = document.createElement("div");
    skeletonGrid.id = "skeleton-grid";
    skeletonGrid.className = "skeleton-grid";

    for (let i = 0; i < count; i++) {
      const card = document.createElement("div");
      card.className = "skeleton-card";
      card.innerHTML = `
        <div class="s-img"></div>
        <div class="s-body">
          <div class="skeleton-line"></div>
          <div class="skeleton-line" style="width:60%"></div>
        </div>
      `;
      skeletonGrid.appendChild(card);
    }

    container.style.display = "none";
    container.parentNode.insertBefore(skeletonGrid, container);
  }

  function hideSkeleton() {
    const old = document.getElementById("skeleton-grid");
    if (old) old.remove();
    container.style.display = "";
  }

  //  FETCH NEWS (with caching + fallback API)
  async function fetchNews(query = "") {
    const cacheKey = query ? `news_${query}` : "news_top";

    loader.style.display = "block";
    showSkeleton(6);

    // Cache check
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const data = JSON.parse(cached);
      if (new Date().getTime() - data.timestamp < CACHE_EXPIRY) {
        console.log("🗄 Loaded from cache:", cacheKey);
        displayNews(data.articles);
        return;
      }
      localStorage.removeItem(cacheKey);
    }

    try {
      // Try GNews first
      let url = `https://gnews.io/api/v4/top-headlines?country=in&lang=en&max=20&token=${GNEWS_KEY}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;

      const res = await fetch(url);
      const data = await res.json();
      let articles = [];

      if (data.articles?.length > 0) {
        articles = data.articles.map(a => ({
          title: a.title,
          description: a.description,
          url: a.url,
          image: a.image || a.image_url || a.urlToImage || null,
          publishedAt: a.publishedAt,
          source: a.source?.name || "Unknown",
          category: query || "top"
        }));
      } else {
        // Fallback: Mediastack
        let mUrl = `https://api.mediastack.com/v1/news?access_key=${MEDIAPACK_KEY}&countries=in&limit=20`;
        if (query) mUrl += `&keywords=${encodeURIComponent(query)}`;

        const mRes = await fetch(mUrl);
        const mData = await mRes.json();

        if (mData.data?.length > 0) {
          articles = mData.data.map(a => ({
            title: a.title,
            description: a.description,
            url: a.url,
            image: a.image || null,
            publishedAt: a.published_at,
            source: a.source || "Unknown",
            category: query || "top"
          }));
        } else {
          container.innerHTML = "<p>No news found.</p>";
          hideSkeleton();
          loader.style.display = "none";
          return;
        }
      }

      // Save to cache
      localStorage.setItem(cacheKey, JSON.stringify({
        articles,
        timestamp: new Date().getTime(),
      }));

      displayNews(articles);

    } catch (err) {
      console.error("Fetch error:", err);
      container.innerHTML = "<p>Unable to load news.</p>";
      hideSkeleton();
      loader.style.display = "none";
    }
  }

  //  DISPLAY NEWS (with fade-in + category stripe)
  function displayNews(articles) {
    hideSkeleton();
    loader.style.display = "none";

    container.innerHTML = "";

    articles.forEach((article, index) => {
      const card = document.createElement("div");
      card.className = "news-card";
      card.style.animationDelay = `${index * 60}ms`; // Step 8D

      card.innerHTML = `
        <div class="card-accent" data-category="${article.category}"></div>

        <div class="card-image">
          <img src="${article.image || 'assets/placeholder.jpeg'}"
               onerror="this.src='assets/placeholder.jpeg'" />
        </div>

        <div class="card-content">
          <h3>${article.title}</h3>

          <div class="card-meta">
            <span class="source">${article.source}</span>
            <span class="dot">•</span>
            <span class="time">${timeAgo(article.publishedAt)}</span>
          </div>

          <p class="description">${article.description || ""}</p>
        </div>
      `;

      // Modal on click
      card.addEventListener("click", () => {
        modalTitle.textContent = article.title;
        modalDesc.textContent = article.description || "No description available.";
        document.getElementById("modal-source").textContent = article.source;
        document.getElementById("modal-time").textContent = timeAgo(article.publishedAt);

        modalImg.src = article.image || "assets/placeholder.jpeg";
        modalLink.href = article.url;

        modal.style.display = "flex";
      });

      container.appendChild(card);
    });

    // Last updated
    const now = new Date();
    lastUpdated.textContent = `Last Updated: ${
      now.getHours().toString().padStart(2, "0")
    }:${now.getMinutes().toString().padStart(2, "0")}:${
      now.getSeconds().toString().padStart(2, "0")
    }`;
  }

  //  Close modal
  closeModal.addEventListener("click", () => modal.style.display = "none");
  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });

  //  Initial Load
  fetchNews();

  //  Search
  searchInput.addEventListener("keypress", e => {
    if (e.key === "Enter") fetchNews(searchInput.value.trim());
  });

});
