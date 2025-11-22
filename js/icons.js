document.addEventListener('DOMContentLoaded', () => {
    const iconsTiles = document.getElementById('iconsTiles');
    const openAddIconPopupBtn = document.getElementById('openAddIconPopupBtn');
    const addIconPopup = document.getElementById('addIconPopup');
    const iconUpload = document.getElementById('iconUpload');
    const iconPreviewContainer = document.getElementById('iconPreviewContainer');
    const iconPreview = document.getElementById('iconPreview');
    const saveIconBtn = document.getElementById('saveIconBtn');
    const cancelIconBtn = document.getElementById('cancelIconBtn');


    function openPopup() {
        addIconPopup.style.display = 'block';
        addIconPopup.setAttribute('aria-hidden', 'false');
        iconUpload.value = '';
        iconPreviewContainer.style.display = 'none';
        iconPreview.src = '';
        saveIconBtn.disabled = true;
    }
    function closePopup() {
        addIconPopup.style.display = 'none';
        addIconPopup.setAttribute('aria-hidden', 'true');
        iconUpload.value = '';
        iconPreviewContainer.style.display = 'none';
        iconPreview.src = '';
        saveIconBtn.disabled = true;
    }

    openAddIconPopupBtn.onclick = openPopup;
    cancelIconBtn.onclick = closePopup;

    iconUpload.onchange = function() {
        if (iconUpload.files && iconUpload.files[0]) {
            const file = iconUpload.files[0];
            const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp'];
            if (!validTypes.includes(file.type)) {
                iconPreviewContainer.style.display = 'none';
                iconPreview.src = '';
                saveIconBtn.disabled = true;
                return;
            }
            const reader = new FileReader();
            reader.onload = function(e) {
                iconPreview.src = e.target.result;
                iconPreviewContainer.style.display = 'block';
                saveIconBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        } else {
            iconPreviewContainer.style.display = 'none';
            iconPreview.src = '';
            saveIconBtn.disabled = true;
        }
    };

    saveIconBtn.onclick = async function() {
        if (!iconUpload.files || !iconUpload.files[0]) return;
        saveIconBtn.disabled = true;
        const formData = new FormData();
        formData.append('icon', iconUpload.files[0]);
        await fetch('/api/menu-icons', { method: 'POST', body: formData });
        closePopup();
        loadIcons();
    };

    async function loadIcons() {
        try {
            const res = await fetch('/api/menu-icons');
            const images = await res.json();
            iconsTiles.innerHTML = '';
            images.forEach(img => {
                const tile = document.createElement('div');
                tile.className = 'tile icon-tile';
                tile.innerHTML = `
                    <img src="/pages/images/menuItems/${img}" alt="${img}">
                    <div class="icon-tile-name">${img}</div>
                    <button class="delete-icon-btn" data-img="${img}">Delete</button>
                `;
                iconsTiles.appendChild(tile);
            });
            document.querySelectorAll('.delete-icon-btn').forEach(btn => {
                btn.onclick = async function() {
                    const img = this.getAttribute('data-img');
                    if (confirm(`Delete icon '${img}'?`)) {
                        await fetch(`/api/menu-icons/${encodeURIComponent(img)}`, { method: 'DELETE' });
                        loadIcons();
                    }
                };
            });
        } catch (err) {
            iconsTiles.innerHTML = '<div class="error">Failed to load icons</div>';
        }
    }

    loadIcons();
});