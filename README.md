# Morning Boost Tracker

A Morning Boost csoportos edzések jelenléti naplója és bérletnyilvántartása (telefonra optimalizálva).

## Futtatás a gépen

```
npm install
npm run dev
```

A futtatáshoz egy `.env.local` fájl kell a projekt gyökerében (ez nem kerül a git-be):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
```

## Élesítés

A `main` ágra feltöltött változtatásokat a GitHub Actions automatikusan kiteszi a GitHub Pages-re
(`.github/workflows/deploy.yml`). A kulcsok a repó *Settings → Secrets and variables → Actions* részében vannak.

## Belépés és adatvédelem

Az alkalmazás belépéssel működik (Supabase Auth, e-mail + jelszó). Az adatbázist a
`supabase/biztonsag.sql` védi: a táblákat csak a tulajdonos fiókja olvashatja és írhatja.
A fájl elején leírt sorrendet tartsd be.

A forráskódba **ne kerüljön** vendégnév, e-mail-cím vagy más személyes adat: minden adat az adatbázisban van.
