---
layout: categories
icon: fas fa-stream
order: 1
---

{% assign categories = site.categories | sort %}
<ul class="categories-list">
  {% for category in categories %}
    <li>
      <a href="{{ site.baseurl }}/categories/{{ category[0] | slugify }}/">{{ category[0] }}</a>
      ({{ category[1].size }})
    </li>
  {% endfor %}
</ul>
