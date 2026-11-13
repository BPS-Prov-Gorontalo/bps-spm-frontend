import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import apiClient from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useSatker } from '../contexts/SatkerContext';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import {
  Edit,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  BookCopy,
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

function DaftarRincian() {
  const { user } = useAuth();
  const { selectedSatkerId, tahunAnggaran, isContextSet } = useSatker();

  // State for pagination, sorting, and search
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Number of SPMs per page

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [sortBy, setSortBy] = useState('tanggal');
  const [sortOrder, setSortOrder] = useState('desc');

  // Debounce search
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
      setSortOrder(
        field === 'satker' || field === 'kodeAkun' ? 'asc' : 'desc'
      );
    }
    setCurrentPage(1);
  };

  const {
    data, // API returns { rincian, totalPages, totalCount, ... }
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'allRincian',
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
        .get('/rincian', {
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

  const allRincian = data?.rincian;
  const totalPages = data?.totalPages;

  const groupedSpms = useMemo(() => {
    if (!allRincian) return [];
    const groups = {};
    const spmOrderMap = new Map();

    allRincian.forEach((rincian) => {
      const spmKey = rincian.spm.nomorSpm;
      if (!groups[spmKey]) {
        groups[spmKey] = {
          ...rincian.spm,
          id: rincian.spmId,
          rincianItems: [],
        };
        spmOrderMap.set(spmKey, spmOrderMap.size);
      }
      groups[spmKey].rincianItems.push(rincian);
    });

    const result = Object.values(groups).sort(
      (a, b) => spmOrderMap.get(a.nomorSpm) - spmOrderMap.get(b.nomorSpm)
    );

    // Sort items inside each SPM if rincian-level sort is applied
    if (sortBy === 'jumlah') {
      result.forEach((spm) => {
        spm.rincianItems.sort((a, b) =>
          sortOrder === 'asc' ? a.jumlah - b.jumlah : b.jumlah - a.jumlah
        );
      });
    } else if (sortBy === 'kodeAkun') {
      result.forEach((spm) => {
        spm.rincianItems.sort((a, b) => {
          const nameA = a.kodeAkun?.nama || '';
          const nameB = b.kodeAkun?.nama || '';
          return sortOrder === 'asc'
            ? nameA.localeCompare(nameB)
            : nameB.localeCompare(nameA);
        });
      });
    } else if (sortBy === 'persentaseKelengkapan') {
      result.forEach((spm) => {
        spm.rincianItems.sort((a, b) =>
          sortOrder === 'asc'
            ? a.persentaseKelengkapan - b.persentaseKelengkapan
            : b.persentaseKelengkapan - a.persentaseKelengkapan
        );
      });
    }

    return result;
  }, [allRincian, sortBy, sortOrder]);

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
                  : 'opacity-0 -translate-y-0.5 group-hover:opacity-40 text-slate-400'
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
            Laporan Semua Rincian
          </h1>
          <p className="text-slate-500 mt-1">
            Daftar terperinci semua item belanja yang dikelompokkan per SPM.
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
              placeholder="Cari nomor SPM / uraian..."
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

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-slate-100">
        {!isContextSet ? (
          <div className="text-center py-16 text-slate-500">
            <div className="p-4 bg-slate-50 rounded-full w-14 h-14 mx-auto mb-3 flex items-center justify-center text-slate-400">
              <BookCopy size={28} />
            </div>
            <p className="font-medium text-slate-700">Konteks Belum Dipilih</p>
            <p className="text-sm mt-1">
              Silakan atur konteks (Satker & Tahun Anggaran) di Dashboard untuk melihat laporan.
            </p>
          </div>
        ) : isLoading && !data ? (
          <div className="text-center py-16 text-slate-500">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-bpsBlue border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm">Memuat Laporan Rincian...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Error: {error.message}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <HeaderCell label="Info SPM" field="tanggal" />
                    {user?.role !== 'op_satker' && (
                      <HeaderCell label="Satker" field="satker" />
                    )}
                    <HeaderCell
                      label="Detail Akun Rincian"
                      field="kodeAkun"
                    />
                    <HeaderCell label="Jumlah" field="jumlah" align="right" />
                    <HeaderCell
                      label="Kelengkapan"
                      field="persentaseKelengkapan"
                      className="w-56"
                    />
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {groupedSpms.length === 0 ? (
                    <tr>
                      <td
                        colSpan={user?.role !== 'op_satker' ? 5 : 4}
                        className="text-center py-12 text-slate-500"
                      >
                        <p className="font-medium">Tidak ada data rincian ditemukan.</p>
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
                    groupedSpms.flatMap((spm, spmIndex) =>
                      spm.rincianItems.map((rincian, rincianIndex) => (
                        <tr
                          key={rincian.id}
                          className="border-b border-slate-100 hover:bg-blue-50/20 transition-colors"
                        >
                          {rincianIndex === 0 && (
                            <td
                              className={`px-6 py-4 align-top ${
                                spmIndex > 0
                                  ? 'border-t-2 border-slate-200'
                                  : ''
                              }`}
                              rowSpan={spm.rincianItems.length}
                            >
                              <div className="font-bold text-sm text-slate-900">
                                {spm.nomorSpm}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {formatDate(spm.tanggal)}
                              </div>
                              <div className="mt-2">
                                <StatusBadge status={spm.status} />
                              </div>
                              <Link
                                to={`/spm/${spm.id}/edit?from=rincian`}
                                state={{ from: '/rincian' }}
                                className="inline-flex items-center gap-1.5 text-xs text-bpsBlue hover:text-bpsBlue-dark hover:underline mt-3 font-semibold"
                              >
                                <Edit size={12} /> <span>Detail SPM</span>
                              </Link>
                            </td>
                          )}
                          {rincianIndex === 0 && user?.role !== 'op_satker' && (
                            <td
                              className={`px-6 py-4 align-top text-sm text-slate-600 font-medium ${
                                spmIndex > 0
                                  ? 'border-t-2 border-slate-200'
                                  : ''
                              }`}
                              rowSpan={spm.rincianItems.length}
                            >
                              {spm.satker?.nama}
                            </td>
                          )}
                          <td
                            className={`px-6 py-4 align-top ${
                              rincianIndex === 0 && spmIndex > 0
                                ? 'border-t-2 border-slate-200'
                                : ''
                            }`}
                          >
                            <div className="text-sm font-semibold text-slate-800">
                              {rincian.kodeAkun.nama}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {rincian.kodeProgram}/{rincian.kodeKegiatan}/
                              {rincian.kodeAkun.kode}
                            </div>
                            {rincian.uraian && (
                              <div className="text-xs text-slate-600 mt-1 italic line-clamp-2">
                                {rincian.uraian}
                              </div>
                            )}
                          </td>
                          <td
                            className={`px-6 py-4 align-top text-sm font-mono text-right font-medium text-slate-800 ${
                              rincianIndex === 0 && spmIndex > 0
                                ? 'border-t-2 border-slate-200'
                                : ''
                            }`}
                          >
                            {formatCurrency(rincian.jumlah)}
                          </td>
                          <td
                            className={`px-6 py-4 align-top ${
                              rincianIndex === 0 && spmIndex > 0
                                ? 'border-t-2 border-slate-200'
                                : ''
                            }`}
                          >
                            <ProgressBar
                              percentage={rincian.persentaseKelengkapan}
                            />
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50/40">
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

export default DaftarRincian;
