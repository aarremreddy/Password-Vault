package com.metasys.VaultApplication.Service;

import com.metasys.VaultApplication.Model.UserDTO;
import com.metasys.VaultApplication.Repo.LoginRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomerUserDetailsService implements UserDetailsService {

    @Autowired
    LoginRepo loginRepo;

    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserDTO user = loginRepo.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        return new org.springframework.security.core.userdetails.User(user.getUsername(), user.getPassword(), List.of(new SimpleGrantedAuthority("admin")));
    }

}