<?php
/**
 * Template Name: Single Pin
 * Template Post Type: pin
 * Description: Display individual pin/project details
 */

get_header();

while (have_posts()) : the_post();
    
    // Get taxonomies
    $geo_regions = wp_get_post_terms(get_the_ID(), 'geographic_region');
    $cycles = wp_get_post_terms(get_the_ID(), 'activity_cycle');
    $audiences = wp_get_post_terms(get_the_ID(), 'target_audience');
    $domains = wp_get_post_terms(get_the_ID(), 'domains');
    
    // Get ACF fields
    $project_link = get_post_meta(get_the_ID(), 'project_link', true);
    ?>

    <article class="pin-detail" dir="rtl">
        <div class="pin-header">
            <h1 class="pin-title"><?php the_title(); ?></h1>
            
            <?php if ($project_link) : ?>
                <a href="<?php echo esc_url($project_link); ?>" 
                   class="pin-website-link" 
                   target="_blank" 
                   rel="noopener">
                    🔗 אתר הפרויקט
                </a>
            <?php endif; ?>
        </div>

        <div class="pin-content">
            <?php the_content(); ?>
        </div>

        <div class="pin-meta">
            <?php if (!empty($geo_regions)) : ?>
                <div class="meta-group">
                    <h3>מרחב גאוגרפי</h3>
                    <div class="meta-tags">
                        <?php foreach ($geo_regions as $region) : ?>
                            <span class="tag geo-tag"><?php echo esc_html($region->name); ?></span>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($cycles)) : ?>
                <div class="meta-group">
                    <h3>מחזור פעילות</h3>
                    <div class="meta-tags">
                        <?php foreach ($cycles as $cycle) : ?>
                            <span class="tag cycle-tag"><?php echo esc_html($cycle->name); ?></span>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($audiences)) : ?>
                <div class="meta-group">
                    <h3>קהל יעד</h3>
                    <div class="meta-tags">
                        <?php foreach ($audiences as $audience) : ?>
                            <span class="tag audience-tag"><?php echo esc_html($audience->name); ?></span>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>

            <?php if (!empty($domains)) : ?>
                <div class="meta-group">
                    <h3>תחומי עיסוק</h3>
                    <div class="meta-tags">
                        <?php foreach ($domains as $domain) : ?>
                            <span class="tag domain-tag"><?php echo esc_html($domain->name); ?></span>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <div class="pin-actions">
            <a href="<?php echo home_url('/מפת-פרויקטים/'); ?>" class="back-to-map">
                ← חזרה למפה
            </a>
        </div>
    </article>

    <style>
        .pin-detail {
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .pin-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #4a90e2;
        }

        .pin-title {
            margin: 0;
            font-size: 32px;
            color: #333;
        }

        .pin-website-link {
            background: #4a90e2;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: background 0.2s;
        }

        .pin-website-link:hover {
            background: #3a7bc8;
        }

        .pin-content {
            font-size: 18px;
            line-height: 1.8;
            color: #555;
            margin-bottom: 40px;
        }

        .pin-meta {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }

        .meta-group {
            margin-bottom: 25px;
        }

        .meta-group:last-child {
            margin-bottom: 0;
        }

        .meta-group h3 {
            font-size: 16px;
            color: #666;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .meta-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }

        .tag {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
        }

        .geo-tag {
            background: #e3f2fd;
            color: #1976d2;
        }

        .cycle-tag {
            background: #f3e5f5;
            color: #7b1fa2;
        }

        .audience-tag {
            background: #e8f5e9;
            color: #388e3c;
        }

        .domain-tag {
            background: #fff3e0;
            color: #f57c00;
        }

        .pin-actions {
            text-align: center;
        }

        .back-to-map {
            display: inline-block;
            color: #4a90e2;
            text-decoration: none;
            font-size: 18px;
            font-weight: 600;
            padding: 12px 24px;
            border: 2px solid #4a90e2;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .back-to-map:hover {
            background: #4a90e2;
            color: white;
        }

        @media (max-width: 768px) {
            .pin-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 15px;
            }

            .pin-title {
                font-size: 24px;
            }
        }
    </style>

<?php endwhile; ?>

<?php get_footer(); ?>
