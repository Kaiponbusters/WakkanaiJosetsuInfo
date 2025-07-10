import { test, expect } from '@playwright/test';
import { generateSnowReportData, generateInvalidSnowReportData } from '../utils/testData';

/**
 * 除雪情報登録フローのE2Eテスト
 * @description 除雪情報の登録機能を統合的にテストする
 */
test.describe('除雪情報登録フロー', () => {
  test.beforeEach(async ({ page }) => {
    // 除雪情報登録ページに遷移
    await page.goto('/create');
    
    // ページの読み込み完了を待機
    await expect(page.locator('h1')).toContainText('除雪情報登録');
  });

  test('正常な除雪情報登録フロー', async ({ page }) => {
    // ユニークなテストデータを生成
    const testData = generateSnowReportData('正常登録テスト');

    // 地域入力
    await page.getByLabel('地域名').fill(testData.area);
    await expect(page.getByLabel('地域名')).toHaveValue(testData.area);

    // 開始時間入力
    await page.getByLabel('除雪開始時間').fill(testData.startTime);
    await expect(page.getByLabel('除雪開始時間')).toHaveValue(testData.startTime);

    // 終了時間入力
    await page.getByLabel('除雪終了時間').fill(testData.endTime);
    await expect(page.getByLabel('除雪終了時間')).toHaveValue(testData.endTime);

    // 登録ボタンがアクティブになることを確認
    const submitButton = page.getByRole('button', { name: '登録' });
    await expect(submitButton).not.toBeDisabled();
    await expect(submitButton).toContainText('登録');

    // フォーム送信
    await submitButton.click();

    // 送信中状態の確認
    await expect(submitButton).toContainText('登録中...');
    await expect(submitButton).toBeDisabled();

    // 成功後のリダイレクトを確認
    await expect(page).toHaveURL('/snowlist');
    
    // 登録された情報が一覧に表示されることを確認
    await expect(page.getByRole('heading', { name: testData.area })).toBeVisible();
  });

  test('必須項目バリデーション', async ({ page }) => {
    const testData = generateSnowReportData('必須項目テスト');
    const submitButton = page.getByRole('button', { name: '登録' });

    // 初期状態では登録ボタンが無効
    await expect(submitButton).toBeDisabled();

    // 地域のみ入力
    await page.getByLabel('地域名').fill(testData.area);
    await expect(submitButton).toBeDisabled();

    // 開始時間も入力
    await page.getByLabel('除雪開始時間').fill(testData.startTime);
    await expect(submitButton).toBeDisabled();

    // 終了時間も入力（全て入力完了）
    await page.getByLabel('除雪終了時間').fill(testData.endTime);
    await expect(submitButton).not.toBeDisabled();
  });

  test('無効な時間範囲のバリデーション', async ({ page }) => {
    // 無効なテストデータを生成
    const invalidData = generateInvalidSnowReportData('時間範囲テスト');
    
    // 終了時間が開始時間より早い場合
    await page.getByLabel('地域名').fill(invalidData.invalidTimeRange.area);
    await page.getByLabel('除雪開始時間').fill(invalidData.invalidTimeRange.startTime);
    await page.getByLabel('除雪終了時間').fill(invalidData.invalidTimeRange.endTime);

    const submitButton = page.getByRole('button', { name: '登録' });
    
    // バリデーションエラーの確認
    await expect(page.getByText('エラー').or(page.locator('.text-red-500')).first()).toBeVisible();
    await expect(submitButton).toBeDisabled();
  });

  test('空文字入力のバリデーション', async ({ page }) => {
    // 無効なテストデータを生成
    const invalidData = generateInvalidSnowReportData('空文字テスト');
    const testData = generateSnowReportData('空文字テスト');
    
    // 地域に空文字を入力
    await page.getByLabel('地域名').fill(invalidData.emptyArea.area);
    await page.getByLabel('除雪開始時間').fill(testData.startTime);
    await page.getByLabel('除雪終了時間').fill(testData.endTime);

    const submitButton = page.getByRole('button', { name: '登録' });
    await expect(submitButton).toBeDisabled();

    // エラーメッセージの確認
    await expect(page.getByText('エラー').or(page.locator('.text-red-500')).first()).toBeVisible();
  });

  test('管理画面へ戻るボタン', async ({ page }) => {
    const backButton = page.getByRole('button', { name: '管理画面へ戻る' }).or(page.getByRole('link', { name: '管理画面へ戻る' }));
    
    await expect(backButton.first()).toBeVisible();
    await backButton.first().click();

    // 一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/snowlist');
  });

  test('フォームリセット機能', async ({ page }) => {
    const testData = generateSnowReportData('リセットテスト');
    
    // フォームに入力
    await page.getByLabel('地域名').fill(testData.area);
    await page.getByLabel('除雪開始時間').fill(testData.startTime);
    await page.getByLabel('除雪終了時間').fill(testData.endTime);

    // 入力値を確認
    await expect(page.getByLabel('地域名')).toHaveValue(testData.area);

    // ページをリロードしてリセット状態を確認
    await page.reload();
    await expect(page.getByLabel('地域名')).toHaveValue('');
    await expect(page.getByLabel('除雪開始時間')).toHaveValue('');
    await expect(page.getByLabel('除雪終了時間')).toHaveValue('');
  });

  test('レスポンシブデザイン確認', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // フォーム要素が適切に表示されることを確認
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByLabel('地域名')).toBeVisible();
    await expect(page.getByLabel('除雪開始時間')).toBeVisible();
    await expect(page.getByLabel('除雪終了時間')).toBeVisible();

    // ボタンが適切に配置されることを確認
    const submitButton = page.getByRole('button', { name: '登録' });
    await expect(submitButton).toBeVisible();
  });

  test('日本語入力処理', async ({ page }) => {
    const japaneseText = 'あいうえお漢字カタカナ';

    // 日本語テキストの入力
    await page.getByLabel('地域名').fill(japaneseText);
    await expect(page.getByLabel('地域名')).toHaveValue(japaneseText);

    // 文字数制限のテスト（大量のテキスト）
    const longText = 'あ'.repeat(100);
    await page.getByLabel('地域名').fill(longText);
    await expect(page.getByLabel('地域名')).toHaveValue(longText);
  });
}); 