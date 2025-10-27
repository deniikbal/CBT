import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { peserta, kelas, jurusan } from '@/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { noUjian, password } = await request.json();

    if (!noUjian || !password) {
      return NextResponse.json(
        { error: 'Nomor ujian dan password harus diisi' },
        { status: 400 }
      );
    }

    // Get peserta with kelas and jurusan info
    const [pesertaData] = await db
      .select({
        id: peserta.id,
        name: peserta.name,
        noUjian: peserta.noUjian,
        password: peserta.password,
        kelasId: peserta.kelasId,
        jurusanId: peserta.jurusanId,
        kelas: {
          id: kelas.id,
          name: kelas.name,
        },
        jurusan: {
          id: jurusan.id,
          name: jurusan.name,
          kodeJurusan: jurusan.kodeJurusan,
        },
      })
      .from(peserta)
      .leftJoin(kelas, eq(peserta.kelasId, kelas.id))
      .leftJoin(jurusan, eq(peserta.jurusanId, jurusan.id))
      .where(eq(peserta.noUjian, noUjian))
      .limit(1);

    if (!pesertaData) {
      return NextResponse.json(
        { error: 'Nomor ujian atau password salah' },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, pesertaData.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Nomor ujian atau password salah' },
        { status: 401 }
      );
    }

    // Remove password from response
    const { password: _, ...pesertaWithoutPassword } = pesertaData;

    return NextResponse.json({
      message: 'Login berhasil',
      peserta: pesertaWithoutPassword,
    });
  } catch (error) {
    console.error('Login peserta error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
