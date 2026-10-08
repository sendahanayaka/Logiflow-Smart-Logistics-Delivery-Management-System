import { test, expect } from '@playwright/test';

test.describe('Customer Order Creation', () => {

    test('Customer logs in and successfully creates a delivery order', async ({ page }) => {
        // 1. Navigate to Login Page
        await page.goto('/login');

        // Retrieve credentials from E2E environment variables
        const email = process.env.E2E_CUSTOMER_EMAIL || 'customer@logiflow.com';
        const password = process.env.E2E_CUSTOMER_PASSWORD || 'customer123';

        // 2. Perform Customer Login
        await page.getByLabel('Email').fill(email);
        await page.getByLabel('Password').fill(password);

        await page.getByRole('button', { name: 'Login' }).click();

        // 3. Verify successful redirection to the Orders dashboard
        await page.waitForURL('**/orders');

        // 4. Navigate directly to Order Creation via client-side routing to avoid SPA reload quirks
        await page.getByRole('link', { name: 'Create Order' }).click();

        // 5. Fill out the required pickup and delivery fields using exact role names
        await page.getByRole('textbox', { name: 'Pickup Address *' }).fill('101 Tech Park Phase 2');
        await page.getByRole('textbox', { name: 'Pickup City *' }).fill('Colombo');

        await page.getByRole('textbox', { name: 'Delivery Address *' }).fill('Building C, Server Farm');
        await page.getByRole('textbox', { name: 'Delivery City *' }).fill('Kandy');

        // 6. Fill out package specifications
        await page.getByRole('textbox', { name: 'Package Description *' }).fill('Enterprise Server Rack Components');
        await page.getByRole('textbox', { name: 'Special Handling' }).fill('Fragile');

        await page.getByRole('spinbutton', { name: 'Weight (kg) *' }).fill('25.5');
        await page.getByRole('spinbutton', { name: 'Length (cm) *' }).fill('120');
        await page.getByRole('spinbutton', { name: 'Width (cm) *' }).fill('45');
        await page.getByRole('spinbutton', { name: 'Height (cm) *' }).fill('80');

        // 7. Schedule details
        await page.getByLabel('Preferred Pickup Date *').fill('2029-12-01');
        await page.getByLabel('Preferred Pickup Time (HH:mm) *').fill('10:00:00');

        await page.getByLabel('Priority *').selectOption('Standard');

        // 8. Recipient details
        await page.getByLabel('Recipient Name').fill('Data Center Operations');
        await page.getByLabel('Recipient Contact').fill('0771234567');

        // 9. Submit the transaction
        const submitBtn = page.getByRole('button', { name: /Calculate Fee & Proceed to Checkout/i });

        // The button must be explicitly enabled since our React state logic disables it when invalid
        await expect(submitBtn).toBeEnabled();

        // Set up the listener for the API response BEFORE clicking the button
        const orderResponsePromise = page.waitForResponse(
            response =>
                response.url().includes('/api/orders') &&
                response.request().method() === 'POST'
        );

        await submitBtn.click();

        // 10. Await the response and assert success directly from the API layer
        const orderResponse = await orderResponsePromise;
        const isOk = orderResponse.ok();
        if (!isOk) {
            const body = await orderResponse.text();
            console.log(`[Diagnostic] API Rejection: Status ${orderResponse.status()} - Body: ${body}`);
        }
        expect(isOk).toBeTruthy();

        const order = await orderResponse.json();
        expect(order.id).toBeTruthy();

        // Optional wait to let the frontend attempt navigation
        await page.waitForTimeout(2000);
    });
});
