package dev.mota.stock_manager.mapper;

import dev.mota.stock_manager.dto.response.UserResponse;
import dev.mota.stock_manager.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {


    public UserResponse toUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );

    }
}
