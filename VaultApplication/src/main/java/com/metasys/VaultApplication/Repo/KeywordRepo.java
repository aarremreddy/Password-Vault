package com.metasys.VaultApplication.Repo;

import com.metasys.VaultApplication.Model.KeywordTag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KeywordRepo extends JpaRepository<KeywordTag, Long> {
    @Query(value = "SELECT vkt.user_id FROM vault_keyword_tags vkt WHERE vkt.keyword_tag = :keywordTag", nativeQuery = true)
    List<Long> findUserIdsByKeywordTag(@Param("keywordTag") String keywordTag);


    @Query(value = "SELECT vkt.id, vkt.keyword_tag FROM vault_keyword_tags vkt WHERE vkt.user_id = :userId", nativeQuery = true)
    List<Object[]> findKeywordTagsForUserId(@Param("userId") long userId);
}
