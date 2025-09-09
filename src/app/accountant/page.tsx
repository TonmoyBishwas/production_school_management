'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Table from '@/components/Table';

interface FinancialStats {
  totalRevenue: number;
  pendingFees: number;
  collectedToday: number;
  totalDefaulters: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

interface RecentTransaction {
  id: string;
  studentName: string;
  studentId: string;
  amount: number;
  type: string;
  status: string;
  date: string;
  paymentMethod: string;
}

export default function AccountantDashboard() {
  const [stats, setStats] = useState<FinancialStats>({
    totalRevenue: 0,
    pendingFees: 0,
    collectedToday: 0,
    totalDefaulters: 0,
    monthlyRevenue: 0,
    yearlyRevenue: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  const navItems = [
    { label: 'Dashboard', href: '/accountant', testId: 'nav-dashboard' },
    { label: 'Payments', href: '/accountant/payments', testId: 'nav-payments' },
    { label: 'Fees', href: '/accountant/fees', testId: 'nav-fees' },
    { label: 'Reports', href: '/accountant/reports', testId: 'nav-reports' },
    { label: 'Defaulters', href: '/accountant/defaulters', testId: 'nav-defaulters' },
    { label: 'Receipts', href: '/accountant/receipts', testId: 'nav-receipts' }
  ];

  const user = {
    username: 'Accountant',
    role: 'accountant'
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [statsRes, transactionsRes, defaultersRes] = await Promise.all([
        fetch('/api/accountant/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/accountant/transactions', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/accountant/defaulters', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats || stats);
      }

      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setRecentTransactions(transactionsData.transactions || []);
      }

      if (defaultersRes.ok) {
        const defaultersData = await defaultersRes.json();
        setDefaulters(defaultersData.defaulters || []);
      }
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const transactionColumns = [
    { key: 'studentName', label: 'Student' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'type', label: 'Fee Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'paymentMethod', label: 'Payment Method' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' }
  ];

  const defaulterColumns = [
    { key: 'studentName', label: 'Student Name' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'grade', label: 'Class' },
    { key: 'outstandingAmount', label: 'Outstanding Amount' },
    { key: 'lastPayment', label: 'Last Payment' },
    { key: 'daysOverdue', label: 'Days Overdue' }
  ];

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const quickActions = [
    {
      title: 'Process Payment',
      description: 'Record new fee payment',
      href: '/accountant/payments/new',
      testId: 'process-payment-btn',
      color: 'bg-success hover:bg-green-700',
      icon: '💳'
    },
    {
      title: 'Add Late Fee',
      description: 'Apply late payment charges',
      href: '/accountant/fees/late',
      testId: 'add-late-fee-btn',
      color: 'bg-warning hover:bg-yellow-700',
      icon: '⏰'
    },
    {
      title: 'Generate Receipt',
      description: 'Create payment receipt',
      href: '/accountant/receipts/new',
      testId: 'generate-receipt-btn',
      color: 'bg-primary hover:bg-primary-dark',
      icon: '🧾'
    },
    {
      title: 'Monthly Report',
      description: 'Download financial reports',
      href: '/accountant/reports/monthly',
      testId: 'monthly-report-btn',
      color: 'bg-secondary hover:bg-secondary-dark',
      icon: '📊'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} navItems={navItems} />
      
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage school finances, payments, and fee collection</p>
        </div>

        {/* Financial Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card testId="total-revenue-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-success" data-testid="total-revenue">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Revenue</div>
            </div>
          </Card>

          <Card testId="pending-fees-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-error" data-testid="pending-fees">
                {formatCurrency(stats.pendingFees)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Pending Fees</div>
            </div>
          </Card>

          <Card testId="collected-today-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary" data-testid="collected-today">
                {formatCurrency(stats.collectedToday)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Collected Today</div>
            </div>
          </Card>

          <Card testId="defaulters-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-warning" data-testid="total-defaulters">
                {stats.totalDefaulters}
              </div>
              <div className="text-sm text-gray-600 mt-1">Fee Defaulters</div>
            </div>
          </Card>

          <Card testId="monthly-revenue-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-secondary" data-testid="monthly-revenue">
                {formatCurrency(stats.monthlyRevenue)}
              </div>
              <div className="text-sm text-gray-600 mt-1">This Month</div>
            </div>
          </Card>

          <Card testId="yearly-revenue-card">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary" data-testid="yearly-revenue">
                {formatCurrency(stats.yearlyRevenue)}
              </div>
              <div className="text-sm text-gray-600 mt-1">This Year</div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card title="Quick Actions" testId="quick-actions-card" className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => window.location.href = action.href}
                className={`${action.color} text-white p-6 rounded-lg text-left hover:opacity-90 transition-opacity`}
                data-testid={action.testId}
              >
                <div className="text-3xl mb-2">{action.icon}</div>
                <div className="font-medium mb-1">{action.title}</div>
                <div className="text-sm opacity-90">{action.description}</div>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <Card title="Recent Transactions" testId="recent-transactions-card">
              <Table
                columns={transactionColumns}
                data={recentTransactions.map(transaction => ({
                  ...transaction,
                  amount: formatCurrency(transaction.amount),
                  status: transaction.status === 'completed' ? '✅ Completed' 
                         : transaction.status === 'pending' ? '⏳ Pending' 
                         : '❌ Failed'
                }))}
                testId="recent-transactions-table"
              />
              
              <div className="mt-4 text-center">
                <Button
                  onClick={() => window.location.href = '/accountant/payments'}
                  variant="secondary"
                  testId="view-all-transactions-btn"
                >
                  View All Transactions
                </Button>
              </div>
            </Card>
          </div>

          {/* Fee Defaulters */}
          <Card title="Fee Defaulters" testId="defaulters-card">
            <Table
              columns={defaulterColumns}
              data={defaulters.slice(0, 5).map((defaulter: any) => ({
                ...defaulter,
                outstandingAmount: formatCurrency(defaulter.outstandingAmount),
                daysOverdue: `${defaulter.daysOverdue} days`
              }))}
              testId="defaulters-table"
            />
            
            <div className="mt-4 space-y-2">
              <Button
                onClick={() => window.location.href = '/accountant/defaulters'}
                variant="secondary"
                testId="view-all-defaulters-btn"
                className="w-full"
              >
                View All Defaulters
              </Button>
              <Button
                onClick={() => window.location.href = '/accountant/reminders'}
                testId="send-reminders-btn"
                className="w-full"
              >
                Send Payment Reminders
              </Button>
            </div>
          </Card>
        </div>

        {/* Collection Summary */}
        <div className="mt-8">
          <Card title="Collection Summary" testId="collection-summary-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {formatCurrency(stats.totalRevenue - stats.pendingFees)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Collected</div>
                <div className="text-xs text-gray-500 mt-1">
                  Collection Rate: {stats.totalRevenue > 0 
                    ? (((stats.totalRevenue - stats.pendingFees) / stats.totalRevenue) * 100).toFixed(1)
                    : 0}%
                </div>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-warning">
                  {formatCurrency(stats.pendingFees)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Outstanding Amount</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.totalDefaulters} students
                </div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {formatCurrency(stats.monthlyRevenue)}
                </div>
                <div className="text-sm text-gray-600 mt-1">Monthly Target</div>
                <div className="text-xs text-gray-500 mt-1">
                  Current Month Progress
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="mt-8">
          <Card title="Accepted Payment Methods" testId="payment-methods-card">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">💳</div>
                <div className="font-medium">Credit/Debit Card</div>
                <div className="text-sm text-gray-600">Online Payments</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">🏦</div>
                <div className="font-medium">Bank Transfer</div>
                <div className="text-sm text-gray-600">Direct Bank Transfer</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">💵</div>
                <div className="font-medium">Cash Payment</div>
                <div className="text-sm text-gray-600">Office Collection</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl mb-2">📱</div>
                <div className="font-medium">UPI/Digital</div>
                <div className="text-sm text-gray-600">Mobile Payments</div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}