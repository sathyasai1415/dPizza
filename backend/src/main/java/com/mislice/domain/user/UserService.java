package com.mislice.domain.user;

import com.mislice.common.exception.ResourceNotFoundException;
import com.mislice.domain.user.dto.AddressDto;
import com.mislice.domain.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final UserMapper userMapper;

    public UserDto getUserProfile(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return userMapper.toDto(user);
    }

    @Transactional
    public UserDto updateProfile(UUID id, UserDto dto) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        
        user.setFullName(dto.fullName());
        user.setPhone(dto.phone());
        user.setVegetarian(dto.vegetarian());
        user.setPreferredCrust(dto.preferredCrust());
        user.setDietaryPrefs(dto.dietaryPrefs());
        user.setMeatPrefs(dto.meatPrefs());
        user.setFavoriteToppings(dto.favoriteToppings());
        user.setBudgetRange(dto.budgetRange());
        user.setAvatarUrl(dto.avatarUrl());
        user.setNotificationsEnabled(dto.notificationsEnabled());

        User saved = userRepository.save(user);
        return userMapper.toDto(saved);
    }

    public List<AddressDto> getAddresses(UUID userId) {
        return userMapper.toAddressDtos(addressRepository.findByUserIdAndDeletedFalse(userId));
    }

    @Transactional
    public AddressDto addAddress(UUID userId, AddressDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", userId));
        
        Address address = Address.builder()
                .user(user)
                .label(dto.label())
                .line1(dto.line1())
                .line2(dto.line2())
                .city(dto.city())
                .state(dto.state() != null ? dto.state() : "MI")
                .postalCode(dto.postalCode())
                .latitude(dto.latitude())
                .longitude(dto.longitude())
                .defaultAddress(dto.defaultAddress())
                .build();

        if (dto.defaultAddress()) {
            // Unset other defaults
            List<Address> existing = addressRepository.findByUserIdAndDeletedFalse(userId);
            for (Address add : existing) {
                if (add.isDefaultAddress()) {
                    add.setDefaultAddress(false);
                    addressRepository.save(add);
                }
            }
        }

        Address saved = addressRepository.save(address);
        return userMapper.toDto(saved);
    }

    @Transactional
    public AddressDto updateAddress(UUID userId, UUID addressId, AddressDto dto) {
        Address address = addressRepository.findById(addressId)
                .filter(a -> a.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));

        address.setLabel(dto.label());
        address.setLine1(dto.line1());
        address.setLine2(dto.line2());
        address.setCity(dto.city());
        address.setState(dto.state());
        address.setPostalCode(dto.postalCode());
        address.setLatitude(dto.latitude());
        address.setLongitude(dto.longitude());
        
        if (dto.defaultAddress() && !address.isDefaultAddress()) {
            List<Address> existing = addressRepository.findByUserIdAndDeletedFalse(userId);
            for (Address add : existing) {
                if (add.isDefaultAddress()) {
                    add.setDefaultAddress(false);
                    addressRepository.save(add);
                }
            }
            address.setDefaultAddress(true);
        }

        Address saved = addressRepository.save(address);
        return userMapper.toDto(saved);
    }

    @Transactional
    public void deleteAddress(UUID userId, UUID addressId) {
        Address address = addressRepository.findById(addressId)
                .filter(a -> a.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException("Address", addressId));
        address.setDeleted(true);
        addressRepository.save(address);
    }
}
