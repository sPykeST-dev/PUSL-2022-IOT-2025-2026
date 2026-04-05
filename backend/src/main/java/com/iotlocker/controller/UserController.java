package com.iotlocker.controller;

import com.iotlocker.dto.StudentRegistrationRequest;
import com.iotlocker.model.Student;
import com.iotlocker.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/students")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        return ResponseEntity.ok(userService.getAllStudents());
    }

    @PostMapping
    public ResponseEntity<?> registerStudent(@RequestBody StudentRegistrationRequest request) {
        try {
            Student registeredStudent = userService.registerStudent(request);
            return ResponseEntity.ok(registeredStudent);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{studentId}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long studentId) {
        try {
            userService.deleteStudent(studentId);
            return ResponseEntity.ok("Student deleted successfully.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}