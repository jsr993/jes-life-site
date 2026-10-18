# JES Life — прототип сайта

Прототип главной страницы JES Life: 3D-hero и сцены в духе MDE.

- `site/` — главная страница: hero на Three.js, блоки «О нас», «Бизнес с нами», «Продукты», «Пауза» и подвал;
- `hero-3d/` — отдельный стенд 3D-hero с отладочными параметрами `?debug`, `?upright`, `?close`, `?nohdri`;
- `serve.mjs` — статический сервер для локального запуска.

Тексты и картинки — демо-контент. Форма в подвале ничего не отправляет.

## Локальный запуск

```bash
node serve.mjs
```

Затем открыть `http://localhost:5173/site/`.

## Библиотеки и ресурсы

- Three.js r169 (jsDelivr);
- GSAP 3.12.5 и ScrollTrigger (cdnjs);
- Lenis 1.1.13 (jsDelivr);
- HDRI `brown_photostudio_02` и `studio_small_09` — Poly Haven, CC0.
