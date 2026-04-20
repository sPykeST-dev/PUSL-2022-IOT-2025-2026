package com.iotlocker.service;

import com.iotlocker.dto.StudentDTO;
import com.iotlocker.dto.StudentRegistrationRequest;
import com.iotlocker.model.RfidCard;
import com.iotlocker.model.Student;
import com.iotlocker.repository.RfidCardRepository;
import com.iotlocker.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final StudentRepository studentRepository;
    private final RfidCardRepository rfidCardRepository;

    public UserService(StudentRepository studentRepository, RfidCardRepository rfidCardRepository) {
        this.studentRepository = studentRepository;
        this.rfidCardRepository = rfidCardRepository;
    }

    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public StudentDTO registerStudent(StudentRegistrationRequest request) {
        if (studentRepository.existsByStudentNumber(request.getStudentNumber())) {
            throw new IllegalArgumentException("Student number already exists.");
        }
        if (rfidCardRepository.existsByUid(request.getRfidCardUid())) {
            throw new IllegalArgumentException("RFID Card UID already registered.");
        }

        Student student = new Student();
        student.setStudentNumber(request.getStudentNumber());
        student.setName(request.getName());
        student.setEmail(request.getEmail());

        Student savedStudent = studentRepository.save(student);

        RfidCard rfidCard = new RfidCard();
        rfidCard.setUid(request.getRfidCardUid());
        rfidCard.setStudent(savedStudent);
        rfidCardRepository.save(rfidCard);

        return new StudentDTO(
                savedStudent.getId(),
                savedStudent.getStudentNumber(),
                savedStudent.getName(),
                savedStudent.getEmail(),
                rfidCard.getUid(),
                savedStudent.getCreatedAt()
        );
    }

    @Transactional
    public void deleteStudent(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new IllegalArgumentException("Student not found.");
        }
        studentRepository.deleteById(studentId);
    }

    private StudentDTO toDTO(Student student) {
        String cardUid = null;
        if (student.getRfidCards() != null && !student.getRfidCards().isEmpty()) {
            cardUid = student.getRfidCards().get(0).getUid();
        }
        return new StudentDTO(
                student.getId(),
                student.getStudentNumber(),
                student.getName(),
                student.getEmail(),
                cardUid,
                student.getCreatedAt()
        );
    }
}
