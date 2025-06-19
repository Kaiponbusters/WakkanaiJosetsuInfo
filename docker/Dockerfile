# ベースイメージとしてNode.jsを使用
FROM node:23

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションをビルド
RUN npm run build

# アプリケーションを起動
CMD ["npm", "run", "dev"]

ENV HOST 0.0.0.0
# コンテナがリッスンするポートを指定
EXPOSE 3000
