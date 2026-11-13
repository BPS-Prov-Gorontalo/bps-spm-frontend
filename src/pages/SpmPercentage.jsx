import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import apiClient from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  FileCheck,
} from 'lucide-react';

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

const formatCurrency = (number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(number || 0);

function SpmPercentage() {
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran, isContextSet } = useSatker();

  // State for pagination, search, and sorting
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [sortBy, setSortBy] = useState('tanggal');
  const [sortOrder, setSortOrder] = useState('desc');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      // Default asc for names and strings, desc for numbers and dates
      setSortOrder(
        field === 'nomorSpm' || field === 'satker' ? 'asc' : 'desc'
      );
    }
    setCurrentPage(1);
  };

  const {
    data, // API returns { spms, totalPages, totalCount, ... }
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'spmsCompleteness',
      {
        satker: selectedSatkerId,
        tahun: tahunAnggaran,
        page: currentPage,
        search: debouncedSearch,
        sortBy,
        order: sortOrder,
      },
    ],
    queryFn: async () =>
      apiClient
        .get('/spm', {
          params: {
            satkerId: selectedSatkerId,
            tahun: tahunAnggaran,
            page: currentPage,
            limit: itemsPerPage,
            search: debouncedSearch,
            sortBy,
            order: sortOrder,
          },
        })
        .then((res) => res.data),
    enabled: isContextSet,
    placeholderData: (previousData) => previousData,
  });

  const spms = data?.spms;
  const totalPages = data?.totalPages;

  // Header Cell Sub-component with sort indicators
  const HeaderCell = ({
    label,
    field,
    align = 'left',
    sortable = true,
    className = '',
  }) => {
    const isActive = sortBy === field;

    return (
      <th
        className={`px-6 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider select-none bg-slate-50 border-b border-slate-200 ${
          sortable
            ? 'cursor-pointer hover:bg-slate-100 hover:text-bpsBlue transition-colors group'
            : ''
        } ${
          align === 'right'
            ? 'text-right'
            : align === 'center'
            ? 'text-center'
            : 'text-left'
        } ${className}`}
        onClick={sortable ? () => handleSort(field) : undefined}
      >
        <div
          className={`flex items-center gap-1.5 ${
            align === 'right'
              ? 'justify-end'
              : align === 'center'
              ? 'justify-center'
              : 'justify-start'
          }`}
        >
          <span>{label}</span>
          {sortable && (
            <span
              className={`transition-all duration-200 ${
                isActive
                  ? 'opacity-100 text-bpsBlue'
                  : 'opacity-0 group-hover:opacity-40 text-slate-400'
              }`}
            >
              {isActive && sortOrder === 'asc' ? (
                <ArrowUp size={14} className="text-bpsBlue stroke-[2.5]" />
              ) : isActive && sortOrder === 'desc' ? (
                <ArrowDown size={14} className="text-bpsBlue stroke-[2.5]" />
              ) : (
                <ArrowUpDown size={14} />
              )}
            </span>
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Laporan Kelengkapan SPM
          </h1>
          <p className="text-slate-500 mt-1">
            Analisis persentase kelengkapan dokumen pendukung untuk setiap SPM.
          </p>
        </div>

        {/* Search Bar */}
        {isContextSet && (
          <div className="relative w-full sm:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Cari nomor SPM..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-bpsBlue/20 focus:border-bpsBlue transition-all shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-100">
        {!isContextSet ? (
          <div className="text-center py-16 text-slate-500">
            <div className="p-4 bg-slate-50 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center text-slate-400">
              <FileCheck size={28} />
            </div>
            <p className="font-medium text-slate-700">Konteks Belum Dipilih</p>
            <p className="text-sm mt-1">
              Silakan atur konteks (Satker & Tahun Anggaran) di Dashboard untuk melihat laporan.
            </p>
          </div>
        ) : isLoading && !data ? (
          <div className="text-center py-16 text-slate-500">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-bpsBlue border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm">Memuat data laporan...</p>
          </div>
        ) : isError ? (
          <p className="text-center text-red-500 py-10">
            Error: {error.message}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <HeaderCell label="Nomor SPM" field="nomorSpm" />
                    <HeaderCell label="Tanggal" field="tanggal" />
                    {user?.role !== 'op_satker' && (
                      <HeaderCell label="Satker" field="satker" />
                    )}
                    <HeaderCell
                      label="Total Anggaran"
                      field="totalAnggaran"
                      align="right"
                    />
                    <HeaderCell label="Status" field="status" align="center" />
                    <HeaderCell
                      label="Kelengkapan Dokumen"
                      field="completenessPercentage"
                      className="w-56"
                    />
                    <th className="relative px-6 py-3 border-b border-slate-200 text-right">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Aksi
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {spms?.length === 0 ? (
                    <tr>
                      <td
                        colSpan={user?.role !== 'op_satker' ? 7 : 6}
                        className="text-center py-12 text-slate-500"
                      >
                        <p className="font-medium">Tidak ada data SPM ditemukan.</p>
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="text-xs text-bpsBlue hover:underline mt-1 font-semibold"
                          >
                            Reset pencarian
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    spms.map((spm) => (
                      <tr
                        key={spm.id}
                        className="hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                          {spm.nomorSpm}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                          {formatDate(spm.tanggal)}
                        </td>
                        {user?.role !== 'op_satker' && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                            {spm.satker?.nama || 'N/A'}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700 font-mono text-right font-medium">
                          {formatCurrency(spm.totalAnggaran)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <StatusBadge status={spm.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ProgressBar
                            percentage={spm.completenessPercentage}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/spm/${spm.id}/edit?from=laporanspm`}
                            state={{
                              from: '/laporanspm',
                              completenessPercentage: spm.completenessPercentage,
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold text-bpsBlue hover:text-white hover:bg-bpsBlue border border-bpsBlue/30 hover:border-bpsBlue transition-all"
                          >
                            Lihat Detail
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentPage(page)}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SpmPercentage;
