create type public.app_role as enum ('admin','manager','driver');
create type public.booking_status as enum ('new','confirmed','driver_assigned','on_the_way','completed','cancelled');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role=_role) $$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id=_user_id and role in ('admin','manager')) $$;

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "admin manage roles" on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.vehicle_classes (
  id text primary key,
  sort int not null default 0,
  name_en text not null, name_es text not null, name_ru text not null,
  max_pax int not null, max_luggage int not null,
  per_km numeric(8,2) not null, base_fare numeric(8,2) not null,
  active boolean not null default true
);
create table public.zones (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  distance_km numeric(8,1) not null,
  duration_min int not null,
  intro_en text not null default '', intro_es text not null default '', intro_ru text not null default '',
  popular boolean not null default true,
  sort int not null default 0
);
create table public.pricing (
  id uuid primary key default gen_random_uuid(),
  zone_id uuid not null references public.zones(id) on delete cascade,
  class_id text not null references public.vehicle_classes(id) on delete cascade,
  price numeric(8,2) not null check (price >= 0),
  unique(zone_id, class_id)
);
create table public.extras (
  id text primary key,
  name_en text not null, name_es text not null, name_ru text not null,
  price numeric(8,2) not null default 0,
  per_unit boolean not null default true,
  active boolean not null default true,
  sort int not null default 0
);
create table public.settings (
  id int primary key default 1 check (id = 1),
  company_name text not null default '[COMPANY LEGAL NAME]',
  phone text not null default '+00 000 000 000',
  whatsapp text not null default '+00000000000',
  email text not null default 'info@example.com',
  night_surcharge_pct numeric(5,2) not null default 0,
  holiday_surcharge_pct numeric(5,2) not null default 0,
  waiting_per_min numeric(6,2) not null default 0.5,
  pay_on_arrival boolean not null default true,
  pay_online boolean not null default false,
  updated_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['vehicle_classes','zones','pricing','extras','settings'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "staff write" on public.%I for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))', t);
  end loop;
end $$;

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);
create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  name text not null,
  phone text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create sequence public.booking_seq start 123;
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('BK-' || extract(year from now())::text || '-' || lpad(nextval('public.booking_seq')::text, 6, '0')),
  status booking_status not null default 'new',
  customer_id uuid references public.customers(id),
  name text not null, email text not null, phone text not null, language text not null default 'en',
  direction text not null,
  pickup text not null, destination text not null,
  zone_id uuid references public.zones(id),
  class_id text not null references public.vehicle_classes(id),
  pickup_at timestamptz not null,
  return_at timestamptz,
  passengers int not null, luggage int not null default 0,
  extra_stops int not null default 0,
  flight_number text, child_boosters int not null default 0, child_babyseats int not null default 0,
  pets boolean not null default false, comments text,
  payment_method text not null default 'arrival',
  price numeric(8,2) not null,
  price_breakdown jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.bookings(pickup_at);
create index on public.bookings(status);
create table public.driver_assignments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  driver_id uuid not null references public.drivers(id) on delete cascade,
  driver_status text not null default 'assigned',
  created_at timestamptz not null default now()
);
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid, action text not null, entity text not null, entity_id text, data jsonb,
  created_at timestamptz not null default now()
);
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null, name text not null, email text not null, phone text, company text, message text not null,
  created_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array['customers','drivers','bookings','driver_assignments','audit_log','contact_requests'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "staff all" on public.%I for all to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()))', t);
  end loop;
end $$;
grant usage on sequence public.booking_seq to service_role, authenticated;

create policy "driver own row" on public.drivers for select to authenticated using (user_id = auth.uid());
create policy "driver own assignments" on public.driver_assignments for select to authenticated using (driver_id in (select id from public.drivers where user_id = auth.uid()));
create policy "driver update own assignments" on public.driver_assignments for update to authenticated using (driver_id in (select id from public.drivers where user_id = auth.uid()));
create policy "driver read assigned bookings" on public.bookings for select to authenticated using (id in (select a.booking_id from public.driver_assignments a join public.drivers d on d.id=a.driver_id where d.user_id = auth.uid()));

create or replace function public.auto_admin_first_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if not exists (select 1 from public.user_roles where role='admin') then
    insert into public.user_roles(user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users for each row execute function public.auto_admin_first_user();

-- SEED
insert into public.settings(id) values (1);
insert into public.vehicle_classes values
 ('economy',1,'Economy','Económico','Эконом',4,3,1.10,25,true),
 ('business',2,'Business','Business','Бизнес',4,3,1.50,35,true),
 ('minivan',3,'Minivan','Minivan','Минивэн',7,7,1.60,40,true),
 ('premium',4,'Premium','Premium','Премиум',4,4,2.20,55,true);
insert into public.extras values
 ('extra_stop','Extra stop','Parada adicional','Доп. остановка',10,true,true,1),
 ('booster','Booster seat','Elevador infantil','Бустер',0,true,true,2),
 ('baby_seat','Baby seat','Silla de bebé','Детское кресло',5,true,true,3),
 ('pet','Pet transport','Mascota','Перевозка животного',10,false,true,4),
 ('meet_greet','Meet & greet sign','Recogida con cartel','Встреча с табличкой',0,false,true,5);
insert into public.zones(slug,name,distance_km,duration_min,sort,intro_en,intro_es,intro_ru) values
 ('city-centre','City Centre',12,20,1,'Quick fixed-price ride from the airport to the city centre.','Traslado rápido a precio fijo al centro.','Быстрый трансфер по фиксированной цене в центр.'),
 ('old-town','Old Town',14,25,2,'Door-to-door transfer to the historic old town.','Traslado puerta a puerta al casco antiguo.','Трансфер до двери в старый город.'),
 ('port','Cruise Port',16,25,3,'Reliable transfers between the airport and the cruise terminal.','Traslados al puerto de cruceros.','Трансферы до круизного терминала.'),
 ('beach-resort','Beach Resort',25,30,4,'Start your holiday stress-free with a ride to the beach resort.','Empieza tus vacaciones sin estrés.','Начните отпуск без стресса.'),
 ('marina','Marina',32,35,5,'Comfortable transfer to the marina and yacht club.','Traslado cómodo al puerto deportivo.','Комфортный трансфер в марину.'),
 ('golf-valley','Golf Valley',40,40,6,'Travel with your golf bags at no extra cost.','Viaja con tus bolsas de golf sin coste extra.','Гольф-сумки без доплаты.'),
 ('north-coast','North Coast',55,50,7,'Scenic coastal transfer to northern towns.','Traslado panorámico a la costa norte.','Живописный трансфер на северное побережье.'),
 ('south-coast','South Coast',60,50,8,'Fixed-price ride along the south coast.','Precio fijo por la costa sur.','Фиксированная цена по южному побережью.'),
 ('mountain-village','Mountain Village',70,65,9,'Relaxed ride up to the mountain villages.','Viaje tranquilo a los pueblos de montaña.','Спокойная поездка в горные деревни.'),
 ('university','University Campus',18,25,10,'Student-friendly fixed fares to the campus.','Tarifas fijas al campus.','Фиксированные тарифы до кампуса.'),
 ('train-station','Central Train Station',11,18,11,'Connect your flight and train with ease.','Conecta tu vuelo y tren fácilmente.','Удобная пересадка с самолёта на поезд.'),
 ('ski-resort','Ski Resort',110,95,12,'Long-distance transfer to the ski slopes.','Traslado a las pistas de esquí.','Трансфер на горнолыжный курорт.');
insert into public.pricing(zone_id,class_id,price)
select z.id, c.id, round((c.base_fare + c.per_km * z.distance_km)::numeric, 0)
from public.zones z cross join public.vehicle_classes c;

insert into public.customers(email,name,phone) values
 ('anna@example.com','Anna Schmidt','+49 151 0000001'),
 ('carlos@example.com','Carlos Ruiz','+34 600 000 002'),
 ('ivan@example.com','Ivan Petrov','+7 900 000 0003');
insert into public.drivers(name,phone) values ('Driver One (demo)','+00 111 111'),('Driver Two (demo)','+00 222 222');
insert into public.bookings(customer_id,name,email,phone,language,direction,pickup,destination,zone_id,class_id,pickup_at,passengers,luggage,flight_number,price,status)
select c.id, c.name, c.email, c.phone, l, 'from_airport','[AIRPORT]', z.name, z.id, cls, now() + (d || ' days')::interval, p, p, f,
 (select price from public.pricing where zone_id=z.id and class_id=cls), st::booking_status
from (values ('anna@example.com','en','city-centre','economy',2,2,'LH1234','new'),
             ('carlos@example.com','es','marina','business',3,1,'IB3456','confirmed'),
             ('ivan@example.com','ru','beach-resort','minivan',5,6,'SU2020','new')) v(e,l,zs,cls,d,p,f,st)
join public.customers c on c.email=v.e join public.zones z on z.slug=v.zs;