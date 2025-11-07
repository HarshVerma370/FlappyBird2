class CustomNavbar extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                .navbar {
                    background: linear-gradient(90deg, #3B82F6 0%, #1D4ED8 100%);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                }
                
                .nav-link:hover {
                    transform: translateY(-2px);
                }
                
                @media (max-width: 640px) {
                    .nav-title {
                        font-size: 1.25rem;
                    }
                }
            </style>
            <nav class="navbar px-6 py-4 text-white">
                <div class="container mx-auto flex justify-between items-center">
                    <div class="flex items-center space-x-2">
                        <i data-feather="wind" class="text-yellow-300"></i>
                        <h1 class="nav-title text-2xl font-bold">Flappy Bird Game</h1>
                    </div>
                    <div class="hidden md:flex space-x-6">
                        <button id ="home">Home</button>
                        <button id ="levels">Levels</button>
                        <button id ="leaderboard">Leaderboard</button>

                    </div>
                    <button class="md:hidden focus:outline-none">
                        <i data-feather="menu"></i>
                    </button>
                </div>
            </nav>
        `;
    }
}

customElements.define('custom-navbar', CustomNavbar);