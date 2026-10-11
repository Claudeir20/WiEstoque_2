package dev.mota.stock_manager.service;

import dev.mota.stock_manager.dto.CreateUserRequest;
import dev.mota.stock_manager.dto.response.UserResponse;
import dev.mota.stock_manager.entity.User;
import dev.mota.stock_manager.exception.EmailAlreadyExistsException;
import dev.mota.stock_manager.mapper.UserMapper;
import dev.mota.stock_manager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;

@Validated
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    @Transactional
    public UserResponse createUser(@Valid CreateUserRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyExistsException(email);
        }


        String passwordHash = passwordEncoder.encode(request.password());

        User user = User.create(
                request.name(),
                email,
                passwordHash
        );

        try {
            User saved = userRepository.saveAndFlush(user);
            return userMapper.toUserResponse(saved);
        } catch (DataIntegrityViolationException e) {
            if (isEmailUniqueViolation(e)) {
                throw new EmailAlreadyExistsException(email);
            }

            throw e;
        }
    }

    private boolean isEmailUniqueViolation(DataIntegrityViolationException e) {
        Throwable cause = e.getMostSpecificCause();
        String message = cause.getMessage();

        return message != null
                && message.toLowerCase(Locale.ROOT)
                .contains("uk_users_email");
    }
}
