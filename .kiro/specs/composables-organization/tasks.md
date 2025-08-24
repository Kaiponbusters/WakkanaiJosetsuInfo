# Implementation Plan

- [x] 1. 新しいディレクトリ構造の作成





  - composables内に機能別サブディレクトリ（notifications、geocoding、forms、ui）を作成
  - 各サブディレクトリの基本構造を準備
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. 不要ファイルの整理と重複ファイルの処理





  - バックアップファイル（.backup）の削除または適切な処理
  - 重複ファイル（.new）の評価と統合
  - 最新版ファイルの特定と保持
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. 通知関連ファイルの移行





  - useNotificationManager.ts/.test.tsをnotificationsディレクトリに移動
  - useNotificationHistoryService.ts/.test.tsをnotificationsディレクトリに移動
  - useNotificationStorage.ts/.test.tsをnotificationsディレクトリに移動
  - useNotificationErrorHandler.ts、useNotificationLogger.tsをnotificationsディレクトリに移動
  - _Requirements: 1.2, 5.1, 5.2_

- [x] 4. 地理情報関連ファイルの移行





  - useGeocodingService.ts/.test.tsをgeocodingディレクトリに移動
  - useGeocodingCache.tsをgeocodingディレクトリに移動
  - useLeafletMap.tsをgeocodingディレクトリに移動
  - _Requirements: 1.3, 5.1, 5.2_

- [x] 5. フォーム・UI関連ファイルの移行





  - useSnowReportForm.tsをformsディレクトリに移動
  - useLoadingState.tsをuiディレクトリに移動
  - _Requirements: 1.1, 5.1, 5.2_

- [x] 6. Import文の自動更新





  - 全プロジェクトファイルから既存のcomposable import文を検索
  - 新しいディレクトリ構造に合わせてimport文を更新
  - TypeScript型チェックエラーがないことを確認
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. 各サブディレクトリのindex.tsファイル生成





  - notifications/index.tsを作成し、通知関連composableをre-export
  - geocoding/index.tsを作成し、地理情報関連composableをre-export
  - forms/index.tsを作成し、フォーム関連composableをre-export
  - ui/index.tsを作成し、UI関連composableをre-export
  - _Requirements: 4.1, 4.2, 4.3_
-

- [x] 8. テストファイル内のimport文更新




  - 移動されたテストファイル内のimport文を新しいパスに更新
  - テスト実行時のモジュール解決が正常に動作することを確認
  - _Requirements: 5.2, 5.3_


- [x] 9. 全体的な動作確認とバリデーション




  - TypeScriptコンパイルエラーがないことを確認
  - 既存の全テストが正常に通ることを確認
  - アプリケーションが正常に起動・動作することを確認
  - 実サーバー環境でのテスト実行（開発サーバー起動後の動作確認）
  - 実際のブラウザでの機能テスト（通知機能、地図機能、フォーム機能）
  - _Requirements: 2.2, 2.3, 5.3_
-

- [x] 10. ドキュメント更新と最終確認




  - 新しいディレクトリ構造に関するドキュメント作成
  - 開発者向けのimport方法ガイド作成
  - 整理完了後のファイル構造確認
  - _Requirements: 4.3, 3.3_