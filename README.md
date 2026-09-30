# Marone 1881 — sito 2026

Sito **statico**: solo HTML, CSS, JavaScript, font e immagini.
Nessun framework, nessuna build, nessuna dipendenza da installare.
Il contenuto di questo repository va caricato così com'è nella document root del server.

222 pagine, 6 lingue, ~99 MB.

---

## Messa online

1. Caricare tutto il contenuto del repository nella document root (`public_html/`, `www/` o equivalente).
2. Verificare che **`.htaccess` sia stato caricato**: è un file nascosto e molti client FTP lo saltano se non si abilita "mostra file nascosti".
3. Se sul server esiste già un `.htaccess`, **non sostituirlo**: le regole di questo file vanno unite a quelle esistenti.

Requisiti: Apache con `mod_rewrite`. Su Nginx le regole di `.htaccess` vanno tradotte in `location`/`rewrite`.
PHP non serve, tranne che per i due form (vedi "Da completare").

---

## Struttura

| percorso | contenuto |
|---|---|
| `index.html` | homepage italiana |
| `uomo/ donna/ campagna-ss26/ brand/ storia/ manifattura/ modelli-icona/ rivenditori/ …` | pagine italiane |
| `en/ fr/ de/ es/ ja/` | le stesse pagine nelle altre 5 lingue |
| `css/marone.css` | foglio di stile unico |
| `js/marone.js` | interazioni generali (header, menu, selettore lingua, store locator) |
| `js/slides.js` | scroll a slide della homepage |
| `fonts/` | font self-hosted in woff2 |
| `img/` | immagini responsive in AVIF / WebP / JPEG |
| `media/` | video corporate |
| `.htaccess` | redirect 301 dai vecchi URL + rimozione di `index.html` dagli URL |
| `sitemap.xml`, `robots.txt` | per i motori di ricerca |

---

## Lingue e URL

Italiano alla radice, le altre lingue in sottocartella: `/en/`, `/fr/`, `/de/`, `/es/`, `/ja/`.

Gli slug italiani sono **identici a quelli del sito attuale**, per non perdere il posizionamento già acquisito.

Ogni pagina ha canonical assoluto e `hreflang` per tutte e 6 le lingue più `x-default`.

---

## SEO

- `sitemap.xml` con tutti i 222 URL, e `robots.txt`
- JSON-LD `@graph` (Organization, WebSite, BreadcrumbList, Product) su ogni pagina
- Open Graph e Twitter Card complete
- immagini responsive con `srcset`/`sizes`, preload dell'immagine LCP, `loading="lazy"` sul resto
- **i redirect 301 nel `.htaccess` non vanno rimossi**: mappano i vecchi URL sui nuovi

---

## Da completare prima del lancio pubblico

1. **`newsletter.php` non esiste.** Il form newsletter in homepage punta a `/newsletter.php`: senza quel file restituisce 404. Va creato oppure va cambiata l'`action` del form.
2. **Google Analytics 4 (`G-V67DJW9LSF`) e banner cookie** — rimossi da questa versione, vanno reinseriti **insieme** prima del lancio.
3. **Dati tecnici delle 18 schede prodotto** — in attesa del catalogo del cliente.
4. **Store locator** — contiene 3 negozi segnaposto.
5. **Pagine legali spagnole** — sul sito attuale contengono testo inglese, da tradurre.

---

## Note tecniche

- I percorsi sono **relativi**: il sito si apre anche da disco con un doppio clic su `index.html`, senza server.
- Lo scroll a slide della homepage (`js/slides.js`) si attiva solo su desktop (larghezza ≥ 900px e puntatore preciso). Su mobile, e con "riduci movimento" attivo nel sistema, la pagina scorre normalmente.
- Il CSS è un unico file, senza preprocessori.
