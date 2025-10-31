import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';

// Register fonts for better typography
Font.register({
  family: 'Helvetica',
  src: 'https://fonts.gstatic.com/s/helvetica/v1/normal.ttf',
});

const styles = StyleSheet.create({
  document: {
    padding: 8,
  },
  page: {
    padding: 4,
    backgroundColor: '#FFFFFF',
  },
  cardsContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  card: {
    width: '48%',
    height: 120,
    border: '1px solid #333333',
    borderRadius: 2,
    padding: 6,
    backgroundColor: '#FFFFFF',
    marginBottom: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    borderBottom: '1px solid #CCCCCC',
    paddingBottom: 4,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 2,
  },
  examName: {
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1F2937',
    lineHeight: 1.2,
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 2,
    fontSize: 5,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 30,
    color: '#374151',
  },
  infoValue: {
    flex: 1,
    color: '#1F2937',
    overflow: 'hidden',
  },
  scheduleSection: {
    marginTop: 3,
    borderTop: '1px solid #E5E7EB',
    paddingTop: 3,
  },
  scheduleHeader: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    padding: 2,
    borderRadius: 2,
    marginBottom: 2,
  },
  scheduleHeaderCell: {
    flex: 1,
    fontSize: 4.5,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#374151',
  },
  scheduleRow: {
    display: 'flex',
    flexDirection: 'row',
    fontSize: 4.5,
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: 1.5,
  },
  scheduleCell: {
    flex: 1,
    textAlign: 'center',
    color: '#1F2937',
  },
  footer: {
    fontSize: 4.5,
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 2,
    paddingTop: 2,
    borderTop: '1px solid #E5E7EB',
  },
});

export interface KartuData {
  id: string;
  name: string;
  noUjian: string;
  password: string;
  kelasName: string | null;
}

export interface ExamData {
  namaUjian: string;
  tanggalUjian: string;
  jamMulai: string;
  durasi: number;
  matpelName: string | null;
}

interface KartuUjianPDFProps {
  pesertaByKelas: {
    kelasName: string;
    peserta: KartuData[];
  }[];
  examData: ExamData;
}

const KartuCard = ({
  peserta,
  examData,
  formattedDate,
}: {
  peserta: KartuData;
  examData: ExamData;
  formattedDate: string;
}) => {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>KARTU UJIAN PESERTA</Text>
        <Text style={styles.examName}>{examData.namaUjian}</Text>
      </View>

      {/* Peserta Info */}
      <View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>No. Ujian:</Text>
          <Text style={styles.infoValue}>{peserta.noUjian}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nama:</Text>
          <Text style={styles.infoValue}>{peserta.name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Kelas:</Text>
          <Text style={styles.infoValue}>{peserta.kelasName || '-'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Password:</Text>
          <Text style={styles.infoValue}>{peserta.password}</Text>
        </View>
      </View>

      {/* Schedule Section */}
      <View style={styles.scheduleSection}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleHeaderCell}>Tanggal</Text>
          <Text style={styles.scheduleHeaderCell}>Waktu Mulai</Text>
          <Text style={styles.scheduleHeaderCell}>Durasi</Text>
          <Text style={styles.scheduleHeaderCell}>Mata Pelajaran</Text>
        </View>
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleCell}>{formattedDate}</Text>
          <Text style={styles.scheduleCell}>{examData.jamMulai}</Text>
          <Text style={styles.scheduleCell}>{examData.durasi} menit</Text>
          <Text style={styles.scheduleCell}>{examData.matpelName || '-'}</Text>
        </View>
      </View>
    </View>
  );
};

export const KartuUjianPDF: React.FC<KartuUjianPDFProps> = ({
  pesertaByKelas,
  examData,
}) => {
  const formattedDate = new Date(examData.tanggalUjian).toLocaleDateString(
    'id-ID',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }
  );

  const cardsPerPage = 12; // 6 rows x 2 columns

  return (
    <Document>
      {pesertaByKelas.map((group) => {
        // Chunk peserta in this kelas into pages
        const pages = [];
        for (let i = 0; i < group.peserta.length; i += cardsPerPage) {
          pages.push(group.peserta.slice(i, i + cardsPerPage));
        }

        return pages.map((pageCards, pageIndex) => (
          <Page key={`${group.kelasName}-${pageIndex}`} size="A4" style={styles.page}>
            <View style={styles.cardsContainer}>
              {pageCards.map((peserta) => (
                <KartuCard
                  key={peserta.id}
                  peserta={peserta}
                  examData={examData}
                  formattedDate={formattedDate}
                />
              ))}
            </View>
            <Text style={styles.footer}>
              Dicetak: {new Date().toLocaleString('id-ID')}
            </Text>
          </Page>
        ));
      })}
    </Document>
  );
};
