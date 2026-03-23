'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

type LessonRecord = {
  id: number
  student_name: string
  lesson_topic: string
  homework: string | null
  next_checkpoint: string | null
  created_at: string
}

type StudentSummary = {
  student_name: string
  count: number
  latestDate: string
}

export default function Home() {
  const [studentName, setStudentName] = useState('')
  const [lessonTopic, setLessonTopic] = useState('')
  const [homework, setHomework] = useState('')
  const [nextCheckpoint, setNextCheckpoint] = useState('')
  const [createdAt, setCreatedAt] = useState(
    new Date().toISOString().slice(0, 10)
  )

  const [records, setRecords] = useState<LessonRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  async function fetchRecords() {
    const { data, error } = await supabase
      .from('lesson_records')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      console.error('조회 오류:', error)
      return
    }

    setRecords(data ?? [])
  }

  function resetForm() {
    setStudentName('')
    setLessonTopic('')
    setHomework('')
    setNextCheckpoint('')
    setCreatedAt(new Date().toISOString().slice(0, 10))
    setEditingId(null)
  }

  async function addRecord() {
    if (!studentName.trim() || !lessonTopic.trim()) {
      alert('학생 이름과 수업 주제는 꼭 입력해야 해.')
      return
    }

    setLoading(true)

    const { error } = await supabase.from('lesson_records').insert([
      {
        student_name: studentName,
        lesson_topic: lessonTopic,
        homework,
        next_checkpoint: nextCheckpoint,
        created_at: createdAt,
      },
    ])

    setLoading(false)

    if (error) {
      console.error('저장 오류:', error)
      alert('저장 실패')
      return
    }

    resetForm()
    await fetchRecords()
  }

  async function updateRecord() {
    if (editingId === null) return

    if (!studentName.trim() || !lessonTopic.trim()) {
      alert('학생 이름과 수업 주제는 꼭 입력해야 해.')
      return
    }

    setLoading(true)

    const { error } = await supabase
      .from('lesson_records')
      .update({
        student_name: studentName,
        lesson_topic: lessonTopic,
        homework,
        next_checkpoint: nextCheckpoint,
        created_at: createdAt,
      })
      .eq('id', editingId)

    setLoading(false)

    if (error) {
      console.error('수정 오류:', error)
      alert('수정 실패')
      return
    }

    resetForm()
    await fetchRecords()
  }

  function startEdit(record: LessonRecord) {
    setEditingId(record.id)
    setStudentName(record.student_name)
    setLessonTopic(record.lesson_topic)
    setHomework(record.homework ?? '')
    setNextCheckpoint(record.next_checkpoint ?? '')
    setCreatedAt(record.created_at)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function deleteRecord(id: number) {
    const { error } = await supabase
      .from('lesson_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('삭제 오류:', error)
      alert('삭제 실패')
      return
    }

    if (editingId === id) {
      resetForm()
    }

    await fetchRecords()
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  const studentSummaries = useMemo(() => {
    const map = new Map<string, StudentSummary>()

    for (const record of records) {
      const existing = map.get(record.student_name)

      if (!existing) {
        map.set(record.student_name, {
          student_name: record.student_name,
          count: 1,
          latestDate: record.created_at,
        })
      } else {
        map.set(record.student_name, {
          student_name: record.student_name,
          count: existing.count + 1,
          latestDate:
            record.created_at > existing.latestDate
              ? record.created_at
              : existing.latestDate,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) =>
      a.student_name.localeCompare(b.student_name, 'ko')
    )
  }, [records])

  const recentRecords = records.slice(0, 5)

  return (
    <main style={{ maxWidth: '900px', margin: '40px auto', padding: '20px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        학생별 수업 기록 앱
      </h1>

      <div
        style={{
          display: 'grid',
          gap: '12px',
          padding: '20px',
          border: '1px solid #ddd',
          borderRadius: '12px',
          marginBottom: '32px',
        }}
      >
        <h2 style={{ margin: 0 }}>
          {editingId === null ? '새 기록 작성' : '기록 수정 중'}
        </h2>

        <input
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="학생 이름"
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <input
          value={lessonTopic}
          onChange={(e) => setLessonTopic(e.target.value)}
          placeholder="수업 주제"
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <textarea
          value={homework}
          onChange={(e) => setHomework(e.target.value)}
          placeholder="숙제"
          rows={4}
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <textarea
          value={nextCheckpoint}
          onChange={(e) => setNextCheckpoint(e.target.value)}
          placeholder="다음 시간 체크포인트"
          rows={4}
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <input
          type="date"
          value={createdAt}
          onChange={(e) => setCreatedAt(e.target.value)}
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={editingId === null ? addRecord : updateRecord}
            disabled={loading}
            style={{
              padding: '12px',
              fontSize: '16px',
              backgroundColor: 'black',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              flex: 1,
            }}
          >
            {loading
              ? editingId === null
                ? '저장 중...'
                : '수정 중...'
              : editingId === null
                ? '기록 저장'
                : '수정 완료'}
          </button>

          {editingId !== null && (
            <button
              onClick={resetForm}
              type="button"
              style={{
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              취소
            </button>
          )}
        </div>
      </div>

      <section style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>학생 목록</h2>

        {studentSummaries.length === 0 ? (
          <p>아직 등록된 학생이 없습니다.</p>
        ) : (
          <div
            style={{
              display: 'grid',
              gap: '16px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            }}
          >
            {studentSummaries.map((student) => (
              <div
                key={student.student_name}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <h3 style={{ marginTop: 0, marginBottom: '12px' }}>
                  <Link
                    href={`/students/${encodeURIComponent(student.student_name)}`}
                    style={{ color: '#2563eb', textDecoration: 'none' }}
                  >
                    {student.student_name}
                  </Link>
                </h3>

                <p style={{ margin: '6px 0' }}>
                  <strong>기록 수:</strong> {student.count}
                </p>
                <p style={{ margin: '6px 0 14px' }}>
                  <strong>최근 작성일:</strong> {student.latestDate}
                </p>

                <Link
                  href={`/students/${encodeURIComponent(student.student_name)}`}
                  style={{
                    display: 'inline-block',
                    padding: '8px 12px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                  }}
                >
                  상세 페이지 보기
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>최근 기록</h2>

        {recentRecords.length === 0 ? (
          <p>최근 기록이 없습니다.</p>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {recentRecords.map((record) => (
              <div
                key={record.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  padding: '16px',
                }}
              >
                <p>
                  <strong>학생 이름:</strong>{' '}
                  <Link
                    href={`/students/${encodeURIComponent(record.student_name)}`}
                    style={{ color: '#2563eb', textDecoration: 'none' }}
                  >
                    {record.student_name}
                  </Link>
                </p>
                <p><strong>수업 주제:</strong> {record.lesson_topic}</p>
                <p><strong>숙제:</strong> {record.homework || '-'}</p>
                <p><strong>다음 시간 체크포인트:</strong> {record.next_checkpoint || '-'}</p>
                <p><strong>작성일:</strong> {record.created_at}</p>

                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => startEdit(record)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    수정
                  </button>

                  <button
                    onClick={() => deleteRecord(record.id)}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'crimson',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}