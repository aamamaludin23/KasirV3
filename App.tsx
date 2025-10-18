

import React from 'react';
import { DataProvider } from './context/DataContext';
import { SettingsProvider } from './context/SettingsContext';
import { NotificationProvider } from './context/NotificationContext';
import { TransactionProvider } from './context/TransactionContext';
import { ShiftProvider } from './context/ShiftContext';
import { SessionProvider, useSession } from './context/SessionContext';
import { StartShiftScreen } from './features/auth/StartShiftScreen';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { ReceiptComponent } from './components/Receipt';
import DashboardPage from './features/dashboard/DashboardPage';
import CashierPage from './features/cashier/CashierPage';
import SalesPage from './features/sales/SalesPage';
import MasterDataPage from './features/master-data/MasterDataPage';
import SettingsPage from './features/settings/SettingsPage';
import AttendancePage from './features/attendance/AttendancePage';
import ReportsPage from './features/reports/ReportsPage';
import { useNotification } from './context/NotificationContext';
import { Modal } from './components/Modal';
import { TransactionSuccessModal } from './features/cashier/TransactionSuccessModal';


// --- NEW MODAL COMPONENT ---
interface EndShiftReportModalProps {
    show: boolean;
    onClose: () => void;
    onConfirm: () => void;
    reportText: string;
}

const EndShiftReportModal: React.FC<EndShiftReportModalProps> = ({ show, onClose, onConfirm, reportText }) => {

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            <Modal show={show} onClose={onClose} title="Laporan Akhir Sesi" size="2xl">
                <div className="text-primary non-printable">
                    <p className="mb-4 text-secondary">Harap cetak laporan kas ini sebelum menyelesaikan sesi. Tombol "Selesaikan Sesi" akan aktif setelah Anda menekan tombol cetak.</p>
                    <div className="bg-tertiary p-4 rounded-md font-mono text-sm whitespace-pre-wrap overflow-x-auto max-h-80">
                        {reportText}
                    </div>
                    <div className="flex justify-end mt-6 pt-4 border-t border-default gap-3">
                        <button onClick={onClose} className="bg-tertiary text-primary font-bold py-3 px-5 rounded-lg hover:bg-gray-300">
                            Batal
                        </button>
                        <button onClick={handlePrint} className="bg-blue-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-blue-700">
                            Cetak Laporan
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="bg-red-600 text-white font-bold py-3 px-5 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Selesaikan Sesi
                        </button>
                    </div>
                </div>
            </Modal>
            {show && (
                <div className="printable-report">
                    <pre className="report-content">{reportText}</pre>
                </div>
            )}
        </>
    );
};
// --- END OF NEW MODAL COMPONENT ---


const PageRenderer: React.FC = () => {
    const { page, setPage } = useSession();

    const renderPage = () => {
        switch (page) {
            case 'Kasir': return <CashierPage />;
            case 'Penjualan': return <SalesPage />;
            case 'Dasbor': return <DashboardPage />;
            case 'Master Data': return <MasterDataPage />;
            case 'Pengaturan': return <SettingsPage />;
            case 'Absensi': return <AttendancePage />;
            case 'Laporan': return <ReportsPage />;
            default: return <CashierPage />;
        }
    }

    return (
         <div className="flex flex-col h-screen bg-primary text-primary">
            <Header page={page} setPage={setPage} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 mb-16 md:mb-0">
                {renderPage()}
            </main>
            <BottomNav page={page} setPage={setPage} />
        </div>
    );
};

const AppContent: React.FC = () => {
    const { activeShift, lastTransaction, settings, receiptRef, navigateAwayData, handleConfirmNavigation, handleCancelNavigation, showEndShiftModal, confirmEndShift, cancelEndShift, reportText, completedTransaction, handlePrintReceipt, closeSuccessModal, showAttendanceReportPrint, setShowAttendanceReportPrint } = useSession();
    const { notification } = useNotification();

    React.useEffect(() => {
        if (showAttendanceReportPrint) {
            const handleAfterPrint = () => {
                document.body.classList.remove('printing-report');
                setShowAttendanceReportPrint(false);
                window.removeEventListener('afterprint', handleAfterPrint);
            };
            window.addEventListener('afterprint', handleAfterPrint);
            document.body.classList.add('printing-report');
            window.print();
        }
    }, [showAttendanceReportPrint, setShowAttendanceReportPrint]);

    if (!activeShift) {
        return <StartShiftScreen />;
    }

    return (
        <>
            <div className="non-printable">
                <PageRenderer />
                {notification && (
                    <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 p-4 rounded-lg shadow-lg text-white ${notification.type === 'success' ? 'bg-green-500' : 'bg-yellow-500'} z-50 text-center text-lg font-semibold`}>
                        {notification.message}
                    </div>
                )}
                 {navigateAwayData && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 fade-enter-active">
                        <div className="bg-secondary rounded-xl shadow-2xl w-full max-w-md p-6 text-primary">
                            <h3 className="text-xl font-bold mb-2">Transaksi Belum Selesai</h3>
                            <p className="text-secondary mb-6">Anda memiliki item di keranjang. Apa yang ingin Anda lakukan?</p>
                            <div className="flex flex-col sm:flex-row justify-end gap-3">
                                <button onClick={handleCancelNavigation} className="bg-tertiary text-primary font-bold py-3 px-4 rounded-lg hover:bg-gray-300">Batal</button>
                                <button onClick={() => handleConfirmNavigation('discard')} className="bg-red-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-700">Lanjutkan & Hapus</button>
                                <button onClick={() => handleConfirmNavigation('hold')} className="accent-bg accent-text font-bold py-3 px-4 rounded-lg accent-bg-hover">Tahan Transaksi</button>
                            </div>
                        </div>
                    </div>
                )}
                <EndShiftReportModal
                    show={showEndShiftModal}
                    onClose={cancelEndShift}
                    onConfirm={confirmEndShift}
                    reportText={reportText}
                />
                <TransactionSuccessModal
                    show={!!completedTransaction}
                    onClose={closeSuccessModal}
                    onPrint={handlePrintReceipt}
                    transaction={completedTransaction}
                />
                <audio id="cash-drawer-sound" src="data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU3LjgyLjEwMAAAAAAAAAAAAAAA//tAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWW6vrG2tba1srKyq6uurq2tra2tra2tra2srKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKysrKywA//uQJAEAAAAAAAAAAAAAAAAD/8AABcQCdAAADSAAAASwA" preload="auto"></audio>
            </div>
            <div className="printable-receipt">
                <ReceiptComponent transaction={lastTransaction} settings={settings} ref={receiptRef} />
            </div>
            {showAttendanceReportPrint && (
                <div className="printable-report">
                    <pre className="report-content">{reportText}</pre>
                </div>
            )}
        </>
    );
}


const App: React.FC = () => {
    return (
        <NotificationProvider>
            <SettingsProvider>
                <DataProvider>
                    <TransactionProvider>
                        <ShiftProvider>
                            <SessionProvider>
                                <AppContent />
                            </SessionProvider>
                        </ShiftProvider>
                    </TransactionProvider>
                </DataProvider>
            </SettingsProvider>
        </NotificationProvider>
    );
};

export default App;
