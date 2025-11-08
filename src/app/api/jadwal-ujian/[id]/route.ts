import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { jadwalUjian, jadwalUjianPeserta, bankSoal, kelas, peserta } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET single jadwal ujian
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [jadwal] = await db
      .select({
        id: jadwalUjian.id,
        namaUjian: jadwalUjian.namaUjian,
        bankSoalId: jadwalUjian.bankSoalId,
        kelasId: jadwalUjian.kelasId,
        tanggalUjian: jadwalUjian.tanggalUjian,
        jamMulai: jadwalUjian.jamMulai,
        durasi: jadwalUjian.durasi,
        minimumPengerjaan: jadwalUjian.minimumPengerjaan,
        acakSoal: jadwalUjian.acakSoal,
        acakOpsi: jadwalUjian.acakOpsi,
        tampilkanNilai: jadwalUjian.tampilkanNilai,
        resetPelanggaranOnEnable: jadwalUjian.resetPelanggaranOnEnable,
        autoSubmitOnViolation: jadwalUjian.autoSubmitOnViolation,
        requireExamBrowser: jadwalUjian.requireExamBrowser,
        allowedBrowserPattern: jadwalUjian.allowedBrowserPattern,
        isActive: jadwalUjian.isActive,
        createdAt: jadwalUjian.createdAt,
        bankSoal: {
          id: bankSoal.id,
          kodeBankSoal: bankSoal.kodeBankSoal,
        },
        kelas: {
          id: kelas.id,
          name: kelas.name,
        },
      })
      .from(jadwalUjian)
      .leftJoin(bankSoal, eq(jadwalUjian.bankSoalId, bankSoal.id))
      .leftJoin(kelas, eq(jadwalUjian.kelasId, kelas.id))
      .where(eq(jadwalUjian.id, id))
      .limit(1);

    if (!jadwal) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    // Get peserta list with kelas info
    const pesertaList = await db
      .select({
        id: peserta.id,
        name: peserta.name,
        noUjian: peserta.noUjian,
        kelasId: peserta.kelasId,
        kelasName: kelas.name,
      })
      .from(jadwalUjianPeserta)
      .innerJoin(peserta, eq(jadwalUjianPeserta.pesertaId, peserta.id))
      .leftJoin(kelas, eq(peserta.kelasId, kelas.id))
      .where(eq(jadwalUjianPeserta.jadwalUjianId, id));

    return NextResponse.json({ ...jadwal, peserta: pesertaList });
  } catch (error) {
    console.error('Error fetching jadwal ujian:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data jadwal ujian' },
      { status: 500 }
    );
  }
}

// PUT update jadwal ujian
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      namaUjian,
      bankSoalId,
      pesertaIds,
      tanggalUjian,
      jamMulai,
      durasi,
      minimumPengerjaan,
      acakSoal,
      acakOpsi,
      tampilkanNilai,
      resetPelanggaranOnEnable,
      autoSubmitOnViolation,
      requireExamBrowser,
      allowedBrowserPattern,
      isActive,
    } = body;

    // Validate required fields
    if (!namaUjian || !bankSoalId || !tanggalUjian || !jamMulai || !durasi) {
      return NextResponse.json(
        { error: 'Nama ujian, bank soal, tanggal, jam mulai, dan durasi harus diisi' },
        { status: 400 }
      );
    }

    // Update jadwal
    const [updated] = await db
      .update(jadwalUjian)
      .set({
        namaUjian,
        bankSoalId,
        kelasId: null, // Always null - no auto-assign by kelas
        tanggalUjian: new Date(tanggalUjian),
        jamMulai,
        durasi,
        minimumPengerjaan: minimumPengerjaan || null,
        acakSoal: acakSoal || false,
        acakOpsi: acakOpsi || false,
        tampilkanNilai: tampilkanNilai !== false,
        resetPelanggaranOnEnable: resetPelanggaranOnEnable !== false,
        autoSubmitOnViolation: autoSubmitOnViolation || false,
        requireExamBrowser: requireExamBrowser || false,
        allowedBrowserPattern: allowedBrowserPattern || 'cbt-',
        isActive: isActive !== false,
        updatedAt: new Date(),
      })
      .where(eq(jadwalUjian.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    // Update peserta if provided
    if (pesertaIds && Array.isArray(pesertaIds)) {
      // Delete existing peserta
      await db
        .delete(jadwalUjianPeserta)
        .where(eq(jadwalUjianPeserta.jadwalUjianId, id));

      // Insert new peserta
      if (pesertaIds.length > 0) {
        const pesertaValues = pesertaIds.map((pesertaId: string) => ({
          jadwalUjianId: id,
          pesertaId,
        }));
        await db.insert(jadwalUjianPeserta).values(pesertaValues);
      }
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating jadwal ujian:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate jadwal ujian' },
      { status: 500 }
    );
  }
}

// PATCH update partial jadwal ujian (e.g., toggle isActive)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(jadwalUjian)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(jadwalUjian.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating jadwal ujian:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate jadwal ujian' },
      { status: 500 }
    );
  }
}

// DELETE jadwal ujian
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [deleted] = await db
      .delete(jadwalUjian)
      .where(eq(jadwalUjian.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: 'Jadwal ujian tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Jadwal ujian berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting jadwal ujian:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus jadwal ujian' },
      { status: 500 }
    );
  }
}
