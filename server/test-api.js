// API Endpoint Test - Corrected
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:8080/api';
const id = Date.now();

async function test() {
    console.log('=== API ENDPOINT TEST ===\n');

    // Create users
    console.log('1. Creating users...');
    const hash = await bcrypt.hash('123456', 10);
    const payer = await prisma.user.create({ data: { email: `payer${id}@t.com`, passwordHash: hash, displayName: 'Payer', status: 'active', balance: 0 } });
    const debtor = await prisma.user.create({ data: { email: `debtor${id}@t.com`, passwordHash: hash, displayName: 'Debtor', status: 'active', balance: 100000 } });
    console.log('   Payer:', payer.id);
    console.log('   Debtor:', debtor.id);

    // Login
    console.log('\n2. Login...');
    const p = await axios.post(`${BASE_URL}/auth/login`, { email: payer.email, password: '123456' });
    const d = await axios.post(`${BASE_URL}/auth/login`, { email: debtor.email, password: '123456' });
    const pToken = p.data.data?.user?.token;
    const dToken = d.data.data?.user?.token;
    console.log('   Payer:', pToken ? 'OK' : 'FAIL');
    console.log('   Debtor:', dToken ? 'OK' : 'FAIL');
    if (!pToken || !dToken) return console.log('   Login response:', p.data, d.data);

    // Create group
    console.log('\n3. Create group...');
    const g = await axios.post(`${BASE_URL}/groups`, { name: `Group${id}`, baseCurrency: 'VND' }, { headers: { Authorization: `Bearer ${pToken}` } });
    const groupId = g.data.data.id;
    console.log('   Group:', groupId);

    // Invite - uses emailInvite, not email
    console.log('\n4. Invite debtor...');
    const inv = await axios.post(`${BASE_URL}/groups/${groupId}/invites`, { emailInvite: debtor.email }, { headers: { Authorization: `Bearer ${pToken}` } });
    console.log('   Invite:', inv.data.success ? 'OK' : 'FAIL', inv.data.data?.token ? '(token received)' : '');
    if (!inv.data.success) return console.log('   Error:', inv.data);

    // Accept invite - POST /groups/invites/accept with token in body
    const acc = await axios.post(`${BASE_URL}/groups/invites/accept`, { token: inv.data.data.token }, { headers: { Authorization: `Bearer ${dToken}` } });
    console.log('   Accept:', acc.data.success ? 'OK' : 'FAIL');
    if (!acc.data.success) console.log('   Error:', acc.data);

    // Create expense
    console.log('\n5. Create expense (ITEM_BASED)...');
    const exp = await axios.post(`${BASE_URL}/groups/${groupId}/expenses`, {
        title: 'Dinner', amountTotal: 150000, splitType: 'ITEM_BASED',
        items: [
            { name: 'Pho', price: 50000, quantity: 1, assignedTo: payer.id },
            { name: 'BanhMi', price: 30000, quantity: 2, assignedTo: debtor.id },
            { name: 'Cafe', price: 20000, quantity: 1, assignedTo: debtor.id }
        ]
    }, { headers: { Authorization: `Bearer ${pToken}` } });
    console.log('   Expense:', exp.data.success ? 'OK' : 'FAIL');
    if (exp.data.data?.shares) console.log('   Shares:', exp.data.data.shares.map(s => `${s.owedAmount}VND`).join(','));
    if (!exp.data.success) return console.log('   Error:', exp.data);

    // Check debts
    console.log('\n6. Check debts (debtor view)...');
    const debts = await axios.get(`${BASE_URL}/groups/${groupId}/debts`, { headers: { Authorization: `Bearer ${dToken}` } });
    console.log('   Success:', debts.data.success);
    console.log('   iOwe:', JSON.stringify(debts.data.data?.iOwe));
    console.log('   netBalance:', debts.data.data?.netBalance);

    // Pending debts
    console.log('\n7. Pending debts...');
    const pending = await axios.get(`${BASE_URL}/groups/${groupId}/debts/pending`, { headers: { Authorization: `Bearer ${dToken}` } });
    console.log('   Success:', pending.data.success);
    console.log('   totalAmount:', pending.data.data?.totalAmount);

    // Credits (payer view)
    console.log('\n8. Credits (payer view)...');
    const credits = await axios.get(`${BASE_URL}/groups/${groupId}/credits/pending`, { headers: { Authorization: `Bearer ${pToken}` } });
    console.log('   Success:', credits.data.success);
    console.log('   totalPending:', credits.data.data?.totalPending);

    // Quick pay
    console.log('\n9. Quick pay (debtor pays payer)...');
    try {
        const pay = await axios.post(`${BASE_URL}/groups/${groupId}/debts/quick-pay`,
            { toUserId: payer.id, amount: 80000, paymentMethod: 'BALANCE' },
            { headers: { Authorization: `Bearer ${dToken}` } }
        );
        console.log('   Success:', pay.data.success);
        console.log('   Status:', pay.data.data?.status);
        console.log('   SettlementId:', pay.data.data?.settlementId);
    } catch (e) {
        console.log('   Error:', e.response?.data || e.message);
    }

    // Final check
    console.log('\n10. Final debts...');
    const final = await axios.get(`${BASE_URL}/groups/${groupId}/debts`, { headers: { Authorization: `Bearer ${dToken}` } });
    console.log('   Final netBalance:', final.data.data?.netBalance);
    if (final.data.data?.netBalance === 0) console.log('   ✅ DEBT FULLY PAID!');

    // Check balances
    const payerFinal = await prisma.user.findUnique({ where: { id: payer.id } });
    const debtorFinal = await prisma.user.findUnique({ where: { id: debtor.id } });
    console.log('\n   Payer balance:', payerFinal?.balance, 'VND');
    console.log('   Debtor balance:', debtorFinal?.balance, 'VND');

    console.log('\n=== TEST COMPLETE ===');
    await prisma.$disconnect();
}

test().catch(e => { console.error('ERROR:', e.response?.data || e.message); process.exit(1); });
