import { test, expect } from '@playwright/test';
import { generateSnowReportData, generateMultipleSnowReportData } from '../utils/testData';

/**
 * 除雪情報CRUD統合テスト
 * @description 除雪情報の作成・読取・更新・削除を通してテストする統合シナリオ
 */
test.describe('除雪情報CRUD統合フロー', () => {

  test('完全なCRUDフローテスト', async ({ page }) => {
    // ユニークなテストデータを生成
    const testData = {
      initial: generateSnowReportData('CRUD統合テスト_初期'),
      updated: generateSnowReportData('CRUD統合テスト_更新')
    };

    // === 1. 作成 (Create) ===
    await page.goto('/create');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('除雪情報登録');

    // フォーム入力
    await page.getByLabel('地域名').fill(testData.initial.area);
    await page.getByLabel('除雪開始時間').fill(testData.initial.startTime);
    await page.getByLabel('除雪終了時間').fill(testData.initial.endTime);

    // 登録実行
    await page.getByRole('button', { name: '登録' }).click();

    // === 2. 読取 (Read) - 一覧ページでの確認 ===
    await expect(page).toHaveURL('/snowlist');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('除雪情報管理');

    // 作成したデータが一覧に表示されることを確認
    await expect(page.getByRole('heading', { name: testData.initial.area })).toBeVisible();
    
    // 詳細情報の確認
    const reportCard = page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: testData.initial.area });
    await expect(reportCard.getByText('除雪開始:', { exact: false })).toBeVisible();
    await expect(reportCard.getByText('除雪終了:', { exact: false })).toBeVisible();

    // === 3. 更新 (Update) ===
    // 編集ボタンをクリック
    await reportCard.getByRole('button', { name: '編集' }).click();

    // 編集モーダルの表示確認
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).toBeVisible();

    // フォームの値を更新
    const areaInput = page.getByLabel('地域名').or(page.locator('input[type="text"]').first());
    const startTimeInput = page.getByLabel('除雪開始時間').or(page.locator('input[type="datetime-local"]').first());
    const endTimeInput = page.getByLabel('除雪終了時間').or(page.locator('input[type="datetime-local"]').last());

    await areaInput.fill(testData.updated.area);
    await startTimeInput.fill(testData.updated.startTime);
    await endTimeInput.fill(testData.updated.endTime);

    // 更新実行
    await page.getByRole('button', { name: '更新' }).click();

    // モーダルが閉じることを確認
    await expect(modal).toBeHidden();

    // 更新された内容が反映されることを確認
    await expect(page.getByRole('heading', { name: testData.updated.area })).toBeVisible();
    await expect(page.getByRole('heading', { name: testData.initial.area })).toBeHidden();

    // === 4. 削除 (Delete) ===
    const updatedCard = page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: testData.updated.area });
    
    // 削除確認ダイアログの処理
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm');
      await dialog.accept();
    });

    // 削除実行
    await updatedCard.getByRole('button', { name: '削除' }).click();

    // 削除されたデータが表示されないことを確認
    await expect(page.getByRole('heading', { name: testData.updated.area })).toBeHidden();
  });

  test('複数データでのCRUD操作', async ({ page }) => {
    // ユニークな複数データを生成
    const multipleData = generateMultipleSnowReportData('複数CRUD操作テスト', 3);

    // 複数データの登録
    for (const data of multipleData) {
      await page.goto('/create');
      
      await page.getByLabel('地域名').fill(data.area);
      await page.getByLabel('除雪開始時間').fill(data.startTime);
      await page.getByLabel('除雪終了時間').fill(data.endTime);
      
      await page.getByRole('button', { name: '登録' }).click();
      await expect(page).toHaveURL('/snowlist');
    }

    // すべてのデータが一覧に表示されることを確認
    for (const data of multipleData) {
      await expect(page.getByRole('heading', { name: data.area })).toBeVisible();
    }

    // 中間のデータを編集
    const targetCard = page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: multipleData[1].area });
    await targetCard.getByRole('button', { name: '編集' }).click();

    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).toBeVisible();

    const editedData = generateSnowReportData('編集済み複数テスト');
    const areaInput = page.getByLabel('地域名').or(page.locator('input[type="text"]').first());
    await areaInput.fill(editedData.area);

    await page.getByRole('button', { name: '更新' }).click();
    await expect(modal).toBeHidden();

    // 編集が反映されることを確認
    await expect(page.getByRole('heading', { name: editedData.area })).toBeVisible();

    // 最初のデータを削除
    const firstCard = page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: multipleData[0].area });
    
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    await firstCard.getByRole('button', { name: '削除' }).click();
    await expect(page.getByRole('heading', { name: multipleData[0].area })).toBeHidden();

    // 残りのデータが正しく表示されることを確認
    await expect(page.getByRole('heading', { name: editedData.area })).toBeVisible();
    await expect(page.getByRole('heading', { name: multipleData[2].area })).toBeVisible();
  });

  test('データ整合性の確認', async ({ page }) => {
    // ユニークなテストデータの作成
    await page.goto('/create');
    
    const dataConsistencyTest = generateSnowReportData('整合性確認テスト');

    await page.getByLabel('地域名').fill(dataConsistencyTest.area);
    await page.getByLabel('除雪開始時間').fill(dataConsistencyTest.startTime);
    await page.getByLabel('除雪終了時間').fill(dataConsistencyTest.endTime);

    await page.getByRole('button', { name: '登録' }).click();
    await expect(page).toHaveURL('/snowlist');

    // 一覧ページでの表示内容確認
    const reportCard = page.locator('.bg-white.rounded-lg.shadow').filter({ hasText: dataConsistencyTest.area });
    
    // 時間情報が正しく表示されることを確認
    await expect(reportCard.getByText('除雪開始:', { exact: false })).toBeVisible();
    await expect(reportCard.getByText('除雪終了:', { exact: false })).toBeVisible();
    await expect(reportCard.getByText('登録日時:', { exact: false })).toBeVisible();

    // 編集モーダルでの値確認
    await reportCard.getByRole('button', { name: '編集' }).click();

    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).toBeVisible();

    // 編集フォームに正しい値が設定されることを確認
    const areaInput = page.getByLabel('地域名').or(page.locator('input[type="text"]').first());
    const startTimeInput = page.getByLabel('除雪開始時間').or(page.locator('input[type="datetime-local"]').first());
    const endTimeInput = page.getByLabel('除雪終了時間').or(page.locator('input[type="datetime-local"]').last());

    await expect(areaInput).toHaveValue(dataConsistencyTest.area);
    await expect(startTimeInput).toHaveValue(dataConsistencyTest.startTime);
    await expect(endTimeInput).toHaveValue(dataConsistencyTest.endTime);

    // キャンセルして閉じる
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(modal).toBeHidden();
  });

  test('ナビゲーション統合テスト', async ({ page }) => {
    // 一覧ページから新規登録へ
    await page.goto('/snowlist');
    await page.getByRole('button', { name: '新規登録' }).or(page.getByRole('link', { name: '新規登録' })).first().click();
    await expect(page).toHaveURL('/create');

    // 新規登録ページから管理画面へ戻る
    await page.getByRole('button', { name: '管理画面へ戻る' }).or(page.getByRole('link', { name: '管理画面へ戻る' })).first().click();
    await expect(page).toHaveURL('/snowlist');

    // 登録フローを実行
    await page.getByRole('button', { name: '新規登録' }).or(page.getByRole('link', { name: '新規登録' })).first().click();
    await expect(page).toHaveURL('/create');

    const navigationTestData = generateSnowReportData('ナビゲーションテスト');

    await page.getByLabel('地域名').fill(navigationTestData.area);
    await page.getByLabel('除雪開始時間').fill(navigationTestData.startTime);
    await page.getByLabel('除雪終了時間').fill(navigationTestData.endTime);

    await page.getByRole('button', { name: '登録' }).click();

    // 登録後に一覧ページに戻ることを確認
    await expect(page).toHaveURL('/snowlist');
    await expect(page.getByRole('heading', { name: navigationTestData.area })).toBeVisible();
  });

  test('エラーハンドリング統合テスト', async ({ page }) => {
    // 不正なデータでの登録試行
    await page.goto('/create');

    const errorTestData = generateSnowReportData('エラーハンドリングテスト');

    // 終了時間が開始時間より早い場合
    await page.getByLabel('地域名').fill(errorTestData.area);
    await page.getByLabel('除雪開始時間').fill('2024-01-15T15:00');
    await page.getByLabel('除雪終了時間').fill('2024-01-15T12:00');

    // フォームバリデーションエラーの確認
    const submitButton = page.getByRole('button', { name: '登録' });
    await expect(submitButton).toBeDisabled();

    // エラーメッセージの表示確認
    const errorMessage = page.getByText('エラー').or(page.locator('.text-red-500')).first();
    await expect(errorMessage).toBeVisible();

    // 正しいデータに修正
    await page.getByLabel('除雪終了時間').fill('2024-01-15T17:00');
    await expect(submitButton).not.toBeDisabled();

    // 正常登録の実行
    await submitButton.click();
    await expect(page).toHaveURL('/snowlist');
    await expect(page.getByRole('heading', { name: errorTestData.area })).toBeVisible();
  });
}); 