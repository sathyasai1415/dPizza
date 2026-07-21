package com.mislice.domain.user;

import com.mislice.domain.user.dto.AddressDto;
import com.mislice.domain.user.dto.PaymentMethodDto;
import com.mislice.domain.user.dto.UserDto;
import org.mapstruct.Mapper;

import java.util.List;

import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UserMapper {

    UserDto toDto(User user);

    AddressDto toDto(Address address);

    List<AddressDto> toAddressDtos(List<Address> addresses);

    PaymentMethodDto toDto(PaymentMethod paymentMethod);

    List<PaymentMethodDto> toPaymentMethodDtos(List<PaymentMethod> methods);
}
