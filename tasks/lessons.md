# Lessons

## デザイン差分の確認で SVG の線属性を見落とした（2026-09-27）

- 原因: design.pen を HTML に書き出して比較する際、要素の `style` とテキストだけを正規化し、SVG の `stroke` / `stroke-width` / `fill` 属性を比較対象から外していた。ノートとペン、カップ印の線色変更を「差分なし」と誤報告した。
- 再発防止: デザイン差分は `style` だけでなく SVG の `stroke` / `stroke-width` / `fill` / `d` など描画属性もすべて比較する。報告前に、変更された色を全要素から検索し、同じ色に変わった他の要素がないか確認する。

## ヒーローの Three.js 描画を画面外でも続けた（2026-09-27）

- 原因: 描画ループの停止条件を `document.hidden` と `prefers-reduced-motion` だけにし、ページ内でヒーローが画面外になる場合を考慮しなかった。
- 再発防止: 常時描画する要素は `IntersectionObserver` で表示状態を監視し、画面外では `setAnimationLoop(null)` で停止する。再表示時だけ再開する。
