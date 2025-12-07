import { ScrollViewStyleReset } from 'expo-router/html';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* SEO Meta Tags */}
        <title>eGlavBuh - Бухгалтерський помічник для ФОП та бухгалтерів</title>
        <meta name="description" content="eGlavBuh – ваш надійний помічник у бухгалтерії. Нагадування про дедлайни, актуальні новини законодавства, калькулятори податків, персоналізований пошук та форум для спілкування." />
        <meta name="keywords" content="бухгалтерія, ФОП, податки, звітність, калькулятор податків, ПДФО, ЄСВ, новини законодавства, бухгалтерський календар" />
        <meta name="author" content="eGlavBuh" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="eGlavBuh - Бухгалтерський помічник" />
        <meta property="og:description" content="Нагадування про дедлайни, актуальні новини законодавства, калькулятори та інструменти для бухгалтерів і ФОП." />
        <meta property="og:image" content="/assets/images/splash-icon.png" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="eGlavBuh - Бухгалтерський помічник" />
        <meta name="twitter:description" content="Нагадування про дедлайни, актуальні новини законодавства, калькулятори та інструменти для бухгалтерів і ФОП." />
        
        {/* Favicon - SVG with PNG fallback */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/assets/images/apple-touch-icon.png" />
        <link rel="shortcut icon" href="/favicon.svg" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme Color */}
        <meta name="theme-color" content="#228822" />
        <meta name="msapplication-TileColor" content="#228822" />

        {/* 
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native. 
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #1a1d21;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #1a1d21;
  }
}`;
