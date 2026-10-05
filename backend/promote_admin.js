const { Client } = require('pg');

async function upgradeToAdmin() {
    const client = new Client({
        connectionString: 'postgresql://logiflow_owner:npg_06mbiRyeOLjt@ep-summer-night-b5el10ly-pooler.c-7.us-east-2.aws.neon.tech/logiflow?sslmode=require'
    });

    try {
        await client.connect();

        // First, find the Admin role ID
        const roleRes = await client.query("SELECT \"Id\" FROM \"Roles\" WHERE \"Name\" = 'ADMIN'");
        if (roleRes.rows.length === 0) {
            console.log("Admin role not found. Make sure migrations were run.");
            return;
        }
        const adminRoleId = roleRes.rows[0].Id;

        // Update admin@logiflow.com
        const res = await client.query(
            "UPDATE \"Users\" SET \"RoleId\" = $1 WHERE \"Email\" = 'admin@logiflow.com'",
            [adminRoleId]
        );

        if (res.rowCount > 0) {
            console.log("SUCCESS: admin@logiflow.com has been upgraded to ADMIN!");
        } else {
            console.log("User admin@logiflow.com not found! Please register the account on the website first.");
        }
    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

upgradeToAdmin();
