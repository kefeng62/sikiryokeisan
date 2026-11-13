# 式量計算

GitHub Pagesで公開できる、HTML/CSS/JavaScript製の式量計算ゲームです。

## 公開方法

1. このフォルダ内の `index.html`、`style.css`、`script.js`、`README.md` をGitHubリポジトリ直下にアップロードします。
2. GitHubの **Settings → Pages** を開きます。
3. **Deploy from a branch** を選び、`main` ブランチの `/ (root)` を指定して保存します。
4. 表示されたURLにアクセスします。

## 問題・原子量の編集

`script.js` 冒頭の `GAME_DATA` を編集してください。

```js
1: {
  atomicMasses: { H: 1, C: 12, O: 16 },
  questions: [
    { formula: 'H2O', name: '水', answer: 18 },
    { formula: 'CO2', name: '二酸化炭素', answer: 44 }
  ]
}
```

- `atomicMasses`: そのレベルの問題画面に表示する原子量一覧
- `formula`: 化学式（例 `Ca(OH)2`）
- `name`: 物質名
- `answer`: 正しい式量。整数で指定

現在入っている問題・原子量は動作確認用の仮データです。実際の出題内容に置き換えてください。

## スコア仕様

レベルを `x`、その問題の誤答回数を `y`、その問題にかかった秒数（小数点以下切り捨て）を `z` として、

`max(10x, 230(x²+x) - 100xy - 5xz)`

を正解時に加算します。最終ランクは、全問題の理論値合計 `問題数 × 230(x²+x)` に対する得点率で判定します。

- 70%以上：S
- 55%以上：A
- 45%以上：B
- 30%以上：C
- 15%以上：D
- 15%未満：E

ハイスコアはブラウザの `localStorage` に保存されます。同じ端末・同じブラウザで利用する場合に保持されます。
