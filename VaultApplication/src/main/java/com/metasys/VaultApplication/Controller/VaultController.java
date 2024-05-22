package com.metasys.VaultApplication.Controller;

import com.metasys.VaultApplication.Model.VaultData;
import com.metasys.VaultApplication.Service.VaultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vault")
public class VaultController {

    @Autowired
    private VaultService vaultService;

    @PostMapping
    public VaultData submitVault(@RequestBody VaultData vaultData){
        return vaultService.submitData(vaultData);
    }

}
