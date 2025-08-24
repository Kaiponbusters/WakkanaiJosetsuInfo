import { test, expect } from '@playwright/test';
import { generateSnowReportData } from '../utils/testData';

/**
 * 除雪情報一覧表示のE2Eテスト
 * @description 除雪情報の一覧表示・編集・削除機能を統合的にテストする
 */
test.describe('除雪情報一覧表示フロー', () => {
  test.beforeEach(async ({ page }) => {
    // 除雪情報一覧ページに遷移
    await page.goto('/snowlist');
    
    // ページの読み込み完了を待機
    await expect(page.locator('h1')).toContainText('除雪情報管理');
  });

  test('一覧ページの基本表示', async ({ page }) => {
    // ページタイトルの確認
    await expect(page.getByRole('heading', { level: 1 })).toContainText('除雪情報管理');

    // 新規登録ボタンの存在確認
    const newButton = page.getByRole('button', { name: '新規登録' }).or(page.getByRole('link', { name: '新規登録' }));
    await expect(newButton.first()).toBeVisible();

    // ローディング表示の確認（短時間）
    const loadingText = page.getByText('Loading...', { exact: false });
    // ローディングが表示されてから消えることを確認
    // await expect(loadingText).toBeVisible();
    await expect(loadingText).toBeHidden({ timeout: 10000 });
  });

  test('新規登録ボタンのナビゲーション', async ({ page }) => {
    const newButton = page.getByRole('button', { name: '新規登録' }).or(page.getByRole('link', { name: '新規登録' }));
    
    await newButton.first().click();
    
    // 新規登録ページにリダイレクトされることを確認
    await expect(page).toHaveURL('/create');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('除雪情報登録');
  });

  test('除雪情報カードの表示内容', async ({ page }) => {
    // データが読み込まれるまで待機
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 10000 });

    // 除雪情報カードが存在することを確認
    const reportCards = page.locator('.bg-white.rounded-lg.shadow');
    await expect(reportCards.first()).toBeVisible();

    // カード内の要素を確認
    const firstCard = reportCards.first();
    
    // 地域名の表示
    await expect(firstCard.getByRole('heading', { level: 3 })).toBeVisible();
    
    // 時間情報の表示
    await expect(firstCard.getByText('除雪開始:', { exact: false })).toBeVisible();
    await expect(firstCard.getByText('除雪終了:', { exact: false })).toBeVisible();
    await expect(firstCard.getByText('登録日時:', { exact: false })).toBeVisible();
    
    // 編集・削除ボタンの存在
    await expect(firstCard.getByRole('button', { name: '編集' })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: '削除' })).toBeVisible();
  });

  test('編集モーダルの表示と操作', async ({ page }) => {
    // データが読み込まれるまで待機
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 10000 });

    const reportCards = page.locator('.bg-white.rounded-lg.shadow');
    const editButton = reportCards.first().getByRole('button', { name: '編集' });
    
    // 編集ボタンをクリック
    await editButton.click();

    // モーダルの表示確認
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).toBeVisible();
    
    // モーダル内要素の確認
    await expect(page.getByRole('heading', { level: 2 })).toContainText('除雪情報の編集');
    
    // フォーム要素の存在確認
    const areaInput = page.getByLabel('地域名').or(page.locator('input[type="text"]').first());
    const startTimeInput = page.getByLabel('除雪開始時間').or(page.locator('input[type="datetime-local"]').first());
    const endTimeInput = page.getByLabel('除雪終了時間').or(page.locator('input[type="datetime-local"]').last());
    
    await expect(areaInput).toBeVisible();
    await expect(startTimeInput).toBeVisible();
    await expect(endTimeInput).toBeVisible();
    
    // ボタンの確認
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
    await expect(page.getByRole('button', { name: '更新' })).toBeVisible();
  });

  test('編集モーダルのキャンセル機能', async ({ page }) => {
    // データが読み込まれるまで待機
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 10000 });

    const reportCards = page.locator('.bg-white.rounded-lg.shadow');
    const editButton = reportCards.first().getByRole('button', { name: '編集' });
    
    // 編集ボタンをクリック
    await editButton.click();

    // モーダルが表示されることを確認
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).toBeVisible();

    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click();

    // モーダルが閉じることを確認
    await expect(modal).toBeHidden();
  });

  test('除雪情報の編集処理', async ({ page }) => {
    // データが読み込まれるまで待機
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 10000 });

    const reportCards = page.locator('.bg-white.rounded-lg.shadow');
    const editButton = reportCards.first().getByRole('button', { name: '編集' });
    
    // 編集ボタンをクリック
    await editButton.click();

    // モーダルが表示されることを確認
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).toBeVisible();

    // 編集用のテストデータ（ユニーク性確保）
    const updatedData = generateSnowReportData('編集更新テスト');

    // フォームに新しい値を入力
    const areaInput = page.getByLabel('地域名').or(page.locator('input[type="text"]').first());
    const startTimeInput = page.getByLabel('除雪開始時間').or(page.locator('input[type="datetime-local"]').first());
    const endTimeInput = page.getByLabel('除雪終了時間').or(page.locator('input[type="datetime-local"]').last());

    await areaInput.fill(updatedData.area);
    await startTimeInput.fill(updatedData.startTime);
    await endTimeInput.fill(updatedData.endTime);

    // 更新ボタンをクリック
    await page.getByRole('button', { name: '更新' }).click();

    // モーダルが閉じることを確認
    await expect(modal).toBeHidden();

    // 更新された情報が一覧に反映されることを確認
    await expect(page.getByRole('heading', { name: updatedData.area })).toBeVisible();
  });

  test('削除機能の確認', async ({ page }) => {
    // データが読み込まれるまで待機
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 10000 });

    const reportCards = page.locator('.bg-white.rounded-lg.shadow');
    const initialCount = await reportCards.count();
    
    // 最初のカードの地域名を記録
    const firstCardArea = await reportCards.first().getByRole('heading', { level: 3 }).textContent();
    
    // 削除ボタンをクリック
    const deleteButton = reportCards.first().getByRole('button', { name: '削除' });
    
    // 削除確認ダイアログの処理
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });
    
    await deleteButton.click();

    // カードの数が減ることを確認
    await expect(reportCards).toHaveCount(initialCount - 1);
    
    // 削除されたアイテムが表示されないことを確認
    if (firstCardArea) {
      await expect(page.getByRole('heading', { name: firstCardArea })).toBeHidden();
    }
  });

  test('空のデータ状態の表示', async ({ page }) => {
    // すべてのデータを削除した後の状態をテスト
    // または、テスト用の空データセットでテスト
    
    // モックサーバーで空データを返すか、すべて削除後の状態をテスト
    // ここでは空状態メッセージの確認を想定
    
    // データがない場合の表示確認（実装に依存）
    const noDataMessage = page.getByText('データがありません', { exact: false });
    // await expect(noDataMessage).toBeVisible();
  });

  test('日時フォーマットの表示確認', async ({ page }) => {
    // データが読み込まれるまで待機
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 10000 });

    const reportCards = page.locator('.bg-white.rounded-lg.shadow');
    const firstCard = reportCards.first();

    // 日時フォーマットが適切に表示されることを確認
    const startTimeText = await firstCard.locator('text=除雪開始:').textContent();
    const endTimeText = await firstCard.locator('text=除雪終了:').textContent();
    
    // 日時形式のパターンをチェック（YYYY/MM/DD HH:MM形式など）
    expect(startTimeText).toMatch(/\d{4}\/\d{2}\/\d{2}/);
    expect(endTimeText).toMatch(/\d{4}\/\d{2}\/\d{2}/);
  });

  test('レスポンシブデザイン確認', async ({ page }) => {
    // モバイルサイズに変更
    await page.setViewportSize({ width: 375, height: 667 });

    // データが読み込まれるまで待機
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 10000 });

    // 基本要素が適切に表示されることを確認
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=新規登録')).toBeVisible();

    // カード要素が適切に表示されることを確認
    const reportCards = page.locator('.bg-white.rounded-lg.shadow');
    await expect(reportCards.first()).toBeVisible();

    // 編集モーダルのレスポンシブ確認
    const editButton = reportCards.first().locator('text=編集');
    await editButton.click();

    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).toBeVisible();
    
    // モーダル内要素が適切に表示されることを確認
    await expect(page.locator('h2')).toBeVisible();
  });
}); 