package com.lms.www.leadmanagement.security;

import com.lms.www.leadmanagement.entity.User;
import com.lms.www.leadmanagement.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with email: " + email));

        java.util.Set<SimpleGrantedAuthority> authorities = new java.util.HashSet<>();
        if (user.getRole() != null) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));

            // Add Role Permissions
            if (user.getRole().getPermissions() != null) {
                user.getRole().getPermissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p.getName())));
            }
        }

        // Combine Direct Permissions (Additive)
        if (user.getDirectPermissions() != null && !user.getDirectPermissions().isEmpty()) {
            user.getDirectPermissions().forEach(p -> authorities.add(new SimpleGrantedAuthority(p.getName())));
        }

        System.out.println(">>> Granted Authorities for " + email + ": " + authorities);

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                authorities);
    }
}
