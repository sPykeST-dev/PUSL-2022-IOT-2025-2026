package com.iotlocker.service;

import com.iotlocker.dto.StudentRegistrationRequest;
import com.iotlocker.model.RfidCard;
import com.iotlocker.model.Student;
import com.iotlocker.repository.RfidCardRepository;
import com.iotlocker.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserService {

    private final StudentRepository studentRepository;
    private final RfidCardRepository rfidCardRepository;

    public UserService(StudentRepository studentRepository, RfidCardRepository rfidCardRepository) {
        this.studentRepository = studentRepository;
        this.rfidCardRepository = rfidCardRepository;
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    @Transactional
    public Student registerStudent(StudentRegistrationRequest request) {
        if (studentRepository.existsByStudentNumber(request.getStudentNumber())) {
            throw new IllegalArgumentException("Student number already exists.");
        }
        if (rfidCardRepository.existsByUid(request.getCardUid())) {
            throw new IllegalArgumentException("RFID Card UID already registered.");
        }

        Student student = new Student();
        student.setStudentNumber(request.getStudentNumber());
        student.setName(request.getName());
        student.setEmail(request.getEmail());

        Student savedStudent = studentRepository.save(student);

        RfidCard rfidCard = new RfidCard();
        rfidCard.setUid(request.getCardUid());
        rfidCard.setStudent(savedStudent);

        rfidCardRepository.save(rfidCard);

        return savedStudent;
    }

    @Transactional
    public void deleteStudent(Long studentId) {
        if (!studentRepository.existsById(studentId)) {
            throw new IllegalArgumentException("Student not found.");
        }
        studentRepository.deleteById(studentId);
    }
}