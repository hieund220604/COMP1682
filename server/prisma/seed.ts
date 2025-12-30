import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Clean existing data (optional - comment out if you want to keep existing data)
    await prisma.expenseShare.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.settlement.deleteMany();
    await prisma.invite.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    console.log('✓ Cleaned existing data');

    // Create test users
    const passwordHash = await bcrypt.hash('Test@123456', 10);

    const alice = await prisma.user.create({
        data: {
            email: 'alice@test.com',
            passwordHash,
            displayName: 'Alice Nguyen',
            status: 'active'
        }
    });

    const bob = await prisma.user.create({
        data: {
            email: 'bob@test.com',
            passwordHash,
            displayName: 'Bob Tran',
            status: 'active'
        }
    });

    const charlie = await prisma.user.create({
        data: {
            email: 'charlie@test.com',
            passwordHash,
            displayName: 'Charlie Le',
            status: 'active'
        }
    });

    console.log('✓ Created 3 test users');
    console.log(`  - Alice: ${alice.id}`);
    console.log(`  - Bob: ${bob.id}`);
    console.log(`  - Charlie: ${charlie.id}`);

    // Create a test group
    const group = await prisma.group.create({
        data: {
            name: 'Nhóm đi ăn tối',
            baseCurrency: 'VND',
            createdBy: alice.id,
            members: {
                create: [
                    { userId: alice.id, role: 'OWNER' },
                    { userId: bob.id, role: 'USER' },
                    { userId: charlie.id, role: 'USER' }
                ]
            }
        }
    });

    console.log(`✓ Created group: ${group.id}`);

    // Create test expenses
    // Expense 1: Alice paid 600k for BBQ, split equally
    const expense1 = await prisma.expense.create({
        data: {
            groupId: group.id,
            title: 'Bữa tối BBQ',
            amountTotal: 600000,
            currency: 'VND',
            category: 'Food',
            paidBy: alice.id,
            note: 'Ăn tại quán BBQ Garden',
            shares: {
                create: [
                    { userId: alice.id, owedAmount: 200000 },
                    { userId: bob.id, owedAmount: 200000 },
                    { userId: charlie.id, owedAmount: 200000 }
                ]
            }
        }
    });

    // Expense 2: Alice paid 500k for groceries, exact split
    const expense2 = await prisma.expense.create({
        data: {
            groupId: group.id,
            title: 'Mua đồ siêu thị',
            amountTotal: 500000,
            currency: 'VND',
            category: 'Groceries',
            paidBy: alice.id,
            note: 'Đồ dùng chung cho tuần',
            shares: {
                create: [
                    { userId: alice.id, owedAmount: 200000 },
                    { userId: bob.id, owedAmount: 200000 },
                    { userId: charlie.id, owedAmount: 100000 }
                ]
            }
        }
    });

    // Expense 3: Bob paid 300k for taxi
    const expense3 = await prisma.expense.create({
        data: {
            groupId: group.id,
            title: 'Tiền taxi đi chơi',
            amountTotal: 300000,
            currency: 'VND',
            category: 'Transport',
            paidBy: bob.id,
            shares: {
                create: [
                    { userId: alice.id, owedAmount: 150000 },
                    { userId: bob.id, owedAmount: 90000 },
                    { userId: charlie.id, owedAmount: 60000 }
                ]
            }
        }
    });

    console.log('✓ Created 3 test expenses');
    console.log(`  - Expense 1 (BBQ): ${expense1.id}`);
    console.log(`  - Expense 2 (Groceries): ${expense2.id}`);
    console.log(`  - Expense 3 (Taxi): ${expense3.id}`);

    // Calculate expected balances:
    // Alice: paid 1,100k, owes 550k -> net: +550k
    // Bob: paid 300k, owes 490k -> net: -190k
    // Charlie: paid 0, owes 360k -> net: -360k

    console.log('\n📊 Expected Balances:');
    console.log('  Alice: +550,000 VND (others owe her)');
    console.log('  Bob: -190,000 VND (owes others)');
    console.log('  Charlie: -360,000 VND (owes others)');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📝 Test credentials:');
    console.log('  Email: alice@test.com / bob@test.com / charlie@test.com');
    console.log('  Password: Test@123456');
    console.log(`\n📦 Group ID: ${group.id}`);
}

main()
    .catch((e) => {
        console.error('Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
